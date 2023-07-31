import * as Schema from "@effect/schema/Schema";
import {
  Context,
  Duration,
  Effect,
  Logger,
  LoggerLevel,
  ReadonlyArray,
  Resource,
  Schedule,
  pipe,
} from "effect";
import * as Http from "effect-http";
import * as Log from "effect-log";

import { FileNotFoundError, readFile } from "./_utils";

const MyValue = Context.Tag<Resource.Resource<FileNotFoundError, string>>();

const readMyValue = Effect.flatMap(MyValue, Resource.get);

const api = pipe(
  Http.api(),
  Http.get("getValue", "/value", { response: Schema.string }),
);

const server = pipe(
  Http.server(api),
  Http.handle("getValue", () =>
    pipe(
      Effect.all(ReadonlyArray.replicate(readMyValue, 10), { concurrency: 10 }),
      Effect.mapError(() => Http.notFoundError("File not found")),
      Effect.map((values) => values.join(", ")),
    ),
  ),
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideServiceEffect(
    MyValue,
    Resource.auto(
      pipe(
        readFile("test-file"),
        Effect.tap(() => Effect.logDebug("MyValue refreshed from file")),
      ),
      Schedule.fixed(Duration.seconds(5)),
    ),
  ),
  Logger.withMinimumLogLevel(LoggerLevel.All),
  Effect.provideSomeLayer(Logger.replace(Logger.defaultLogger, Log.pretty)),
  Effect.scoped,
  Effect.runPromise,
);
