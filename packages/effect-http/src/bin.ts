import { Command, HelpDoc, Options, ValidationError } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import * as HttpMiddleware from "@effect/platform/HttpMiddleware";
import * as Path from "@effect/platform/Path";
import { Schema } from "@effect/schema";
import { Console, Data, Effect, Option, pipe } from "effect";
import { NodeServer } from "effect-http-node";
import * as PrettyLogger from "effect-log/PrettyLogger";
import * as importx from "importx";
import pkg from "../package.json";
import * as CliConfig from "./CliConfig.js";
import * as ExampleServer from "./ExampleServer.js";
import * as RouterBuilder from "./RouterBuilder.js";
import { Api, ApiEndpoint } from "./index.js";

/**
 * An error that occurs when loading the config file.
 */
class ConfigError extends Data.TaggedError("ConfigError")<{
  message: string;
}> {}

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
      Effect.withSpan("loadConfig", { attributes: { path } }),
    ),
  );

const urlArg = Options.text("url").pipe(
  Options.withDescription("URL to make the request to"),
  Options.optional,
);

const configArg = Options.file("config").pipe(
  Options.withAlias("c"),
  Options.withDescription("Path to the config file"),
  Options.withDefault("./effect-http.config.ts"),
  Options.mapEffect((s) =>
    loadConfig(s).pipe(
      Effect.mapError((e) =>
        ValidationError.invalidArgument(HelpDoc.h1(e.message)),
      ),
    ),
  ),
);

const portArg = Options.integer("port").pipe(
  Options.withAlias("p"),
  Options.withDescription("Port to run the server on"),
  Options.optional,
);

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user", { description: "Get a user by their id" }).pipe(
      Api.setResponseBody(Schema.Number),
    ),
  ),
);

export const genClientCli = (api: Api.Api.Any) => {
  return api.groups
    .map((group) => group.endpoints)
    .flat()
    .map((endpoint) => {
      return Command.make(
        ApiEndpoint.getId(endpoint),
        { url: urlArg },
        (args) => Effect.log(`Making request to ${args.url}`),
      ).pipe(
        Command.withDescription(
          ApiEndpoint.getOptions(endpoint).description || "",
        ),
      );
    });
};

const serveCommand = Command.make(
  "serve",
  { port: portArg },
  (args) =>
    Effect.gen(function* () {
      const { config } = yield* rootCommand
      const port =
        Option.getOrUndefined(args.port) ?? config.server?.port ?? 11779;
      yield* ExampleServer.make(config.api).pipe(
        RouterBuilder.buildPartial,
        HttpMiddleware.logger,
        NodeServer.listen({ port }),
      );
    }),
).pipe(Command.withDescription("Start an example server"));

const clientCommand = Command.make(
  "client",
  { url: urlArg },
  (args) =>
    Effect.gen(function* () {
      // const { config } = yield* rootCommand
      const endpoints = api.groups.map((group) => group.endpoints).flat();
      yield* Console.log(endpoints[0].pipe(ApiEndpoint.getId));
    }),
);

const rootCommand = Command.make("effect-http", {
  config: configArg,
})

const cli = Command.run(
  rootCommand.pipe(
    Command.withSubcommands([serveCommand, clientCommand]),
  ),
  {
    name: "Effect Http Cli",
    version: `v${pkg.version}`,
  },
);

cli(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  Effect.catchAll(Effect.logError),
  Effect.provide(PrettyLogger.layer({ showFiberId: false })),
  NodeRuntime.runMain,
);
