import {
  Command,
  HelpDoc,
  Options,
  Prompt,
  ValidationError,
} from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import * as HttpMiddleware from "@effect/platform/HttpMiddleware";
import * as Path from "@effect/platform/Path";
import { Console, Data, Effect, Option } from "effect";
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
  Effect.flatMap(Path.Path, (path) => {
    const fullPath = path.join(process.cwd(), relativePath);
    return Effect.tryPromise(() =>
      importx.import(fullPath, import.meta.url),
    ).pipe(
      Effect.mapError(
        () =>
          new ConfigError({ message: `Failed to find config at ${fullPath}` }),
      ),
      Effect.flatMap((module) =>
        module?.default
          ? Effect.succeed(module.default)
          : new ConfigError({
              message: `No default export found in ${fullPath}`,
            }),
      ),
      Effect.flatMap((defaultExport) =>
        CliConfig.isCliConfig(defaultExport)
          ? Effect.succeed(defaultExport)
          : new ConfigError({ message: `Invalid config found in ${fullPath}` }),
      ),
      Effect.withSpan("loadConfig", { attributes: { fullPath } }),
    );
  });

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

const serveCommand = Command.make("serve", { port: portArg }, (args) =>
  Effect.gen(function* () {
    const { config } = yield* rootCommand;
    const port =
      Option.getOrUndefined(args.port) ?? config.server?.port ?? 11779;
    yield* ExampleServer.make(config.api).pipe(
      RouterBuilder.buildPartial,
      HttpMiddleware.logger,
      NodeServer.listen({ port }),
    );
  }),
).pipe(Command.withDescription("Start an example server"));

const clientCommand = Command.make("client", { url: urlArg }, (args) =>
  Effect.gen(function* () {
    const { config } = yield* rootCommand;
    const endpoints = config.api.groups.map((group) => group.endpoints).flat();

    const selectedEndpoint = yield* Prompt.select({
      message: "Select an endpoint",
      choices: endpoints.map((endpoint) => ({
        value: endpoint,
        title: ApiEndpoint.getId(endpoint),
        describe: ApiEndpoint.getOptions(endpoint).description,
      })),
    });

    yield* Effect.log(selectedEndpoint);
  }),
);

const rootCommand = Command.make("effect-http", {
  config: configArg,
});

/**
 * List endpoints
 */
const listCommand = Command.make("list", {}, (args) =>
  Effect.gen(function* () {
    const { config } = yield* rootCommand;
    const endpoints = config.api.groups.map((group) => group.endpoints).flat();
    yield* Console.log(
      endpoints
        .map(
          (e) =>
            `${ApiEndpoint.getId(e)}(${ApiEndpoint.getMethod(e)} ${ApiEndpoint.getPath(e)}): ${ApiEndpoint.getOptions(e).description}`,
        )
        .join("\n"),
    );
  }),
).pipe(Command.withDescription("List all endpoints"));

const cli = Command.run(
  rootCommand.pipe(
    Command.withSubcommands([listCommand, serveCommand, clientCommand]),
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
