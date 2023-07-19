import * as Log from "effect-log";

import * as Context from "@effect/data/Context";
import * as Duration from "@effect/data/Duration";
import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as LogLevel from "@effect/io/Logger/Level";
import * as Resource from "@effect/io/Resource";
import * as Schedule from "@effect/io/Schedule";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

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
      Effect.all(RA.replicate(readMyValue, 10), { concurrency: 10 }),
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
  Logger.withMinimumLogLevel(LogLevel.All),
  Effect.provideSomeLayer(Logger.replace(Logger.defaultLogger, Log.pretty)),
  Effect.scoped,
  Effect.runPromise,
);
