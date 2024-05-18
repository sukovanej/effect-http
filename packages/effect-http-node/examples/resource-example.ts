import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Array, Context, Duration, Effect, pipe, Resource, Schedule } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { HttpError } from "effect-http-error"

import { NodeServer } from "effect-http-node"
import type { FileNotFoundError } from "./_utils.js"
import { debugLogger, readFile } from "./_utils.js"

const MyValue = Context.GenericTag<Resource.Resource<string, FileNotFoundError>>("@services/MyValue")

const readMyValue = Effect.flatMap(MyValue, Resource.get)

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("getValue", "/value").pipe(
      Api.setResponseBody(Schema.String)
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getValue", () =>
    pipe(
      Effect.all(Array.replicate(readMyValue, 10), { concurrency: 10 }),
      Effect.mapError(() => HttpError.notFoundError("File not found")),
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
