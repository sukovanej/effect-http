import { runMain } from "@effect/platform-node/Runtime"
import * as Schema from "@effect/schema/Schema"
import { Context, Duration, Effect, pipe, ReadonlyArray, Resource, Schedule } from "effect"
import { Api, NodeServer, RouterBuilder, ServerError } from "effect-http"

import type { FileNotFoundError } from "./_utils.js"
import { debugLogger, readFile } from "./_utils.js"

const MyValue = Context.Tag<Resource.Resource<FileNotFoundError, string>>()

const readMyValue = Effect.flatMap(MyValue, Resource.get)

const api = pipe(
  Api.api(),
  Api.get("getValue", "/value", { response: Schema.string })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getValue", () =>
    pipe(
      Effect.all(ReadonlyArray.replicate(readMyValue, 10), { concurrency: 10 }),
      Effect.mapError(() => ServerError.notFoundError("File not found")),
      Effect.map((values) => values.join(", "))
    )),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provideServiceEffect(
    MyValue,
    Resource.auto(
      pipe(
        readFile("test-file"),
        Effect.tap(() => Effect.logDebug("MyValue refreshed from file"))
      ),
      Schedule.fixed(Duration.seconds(5))
    )
  ),
  Effect.scoped,
  Effect.provide(debugLogger),
  runMain
)
