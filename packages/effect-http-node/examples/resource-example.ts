import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Context, Duration, Effect, pipe, ReadonlyArray, Resource, Schedule } from "effect"
import { Api, RouterBuilder, ServerError } from "effect-http"

import { NodeServer } from "effect-http-node"
import type { FileNotFoundError } from "./_utils.js"
import { debugLogger, readFile } from "./_utils.js"

const MyValue = Context.GenericTag<Resource.Resource<string, FileNotFoundError>>("@services/MyValue")

const readMyValue = Effect.flatMap(MyValue, Resource.get)

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("getValue", "/value").pipe(
      Api.setResponseBody(Schema.string)
    )
  )
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
  NodeRuntime.runMain
)
