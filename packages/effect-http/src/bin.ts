import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import * as HttpMiddleware from "@effect/platform/HttpMiddleware";
import * as Path from "@effect/platform/Path";
import { Data, Effect, Option } from "effect";
import { NodeServer } from "effect-http-node";
import * as PrettyLogger from "effect-log/PrettyLogger";
import * as importx from "importx";
import pkg from "../package.json";
import * as CliConfig from "./CliConfig.js";
import * as ExampleServer from "./ExampleServer.js";
import * as RouterBuilder from "./RouterBuilder.js";


/**
 * An error that occurs when loading the config file.
 */
class ConfigError extends Data.TaggedError("ConfigError")<{
  message: string;
}> {}

const configArg = Options.file("config").pipe(
  Options.withAlias("c"),
  Options.withDescription("Path to the config file"),
  Options.withDefault("./effect-http.config.ts"),
);

const portArg = Options.integer("port").pipe(
  Options.withAlias("p"),
  Options.withDescription("Port to run the server on"),
  Options.optional
);

const loadConfig = (relativePath: string) =>
  Effect.flatMap(Path.Path, (path) =>
    Effect.tryPromise(() =>
      importx.import(path.join(process.cwd(), relativePath), import.meta.url),
    ).pipe(
      Effect.mapError(
        () => new ConfigError({ message: `Failed to find config at ${path}` }),
      ),
      Effect.flatMap((module) =>
        module?.default
          ? Effect.succeed(module.default)
          : new ConfigError({ message: `No default export found in ${path}` }),
      ),
      Effect.flatMap((defaultExport) =>
        CliConfig.isCliConfig(defaultExport)
          ? Effect.succeed(defaultExport)
          : new ConfigError({ message: `Invalid config found in ${path}` }),
      ),
      Effect.withSpan("loadConfig", { attributes: { path } })
    ),
  );

const command = Command.make("serve", { config: configArg, port: portArg }, (args) =>
  Effect.gen(function* () {
    const config = yield* loadConfig(args.config);
    const port = Option.getOrUndefined(args.port) ?? config.server?.port ?? 11779;
    yield* ExampleServer.make(config.api).pipe(
      RouterBuilder.buildPartial,
      HttpMiddleware.logger,
      NodeServer.listen({ port })
    )
  }),
);

const cli = Command.run(command, {
  name: "Effect Http Cli",
  version: `v${pkg.version}`,
});

cli(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  Effect.provide(PrettyLogger.layer({ showFiberId: false })),
  NodeRuntime.runMain,
);
