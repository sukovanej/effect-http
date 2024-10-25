import type { Error } from "@effect/platform"
import { FileSystem } from "@effect/platform"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Array, Context, Duration, Effect, Logger, LogLevel, pipe, Resource, Schedule, Schema } from "effect"
import { Api, HttpError, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const MyValue = Context.GenericTag<Resource.Resource<string, Error.PlatformError>>("@services/MyValue")

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
      Effect.mapError(() => HttpError.notFound("File not found")),
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
      FileSystem.FileSystem.pipe(
        Effect.flatMap(({ readFileString }) => readFileString("test-file")),
        Effect.tap(() => Effect.logDebug("MyValue refreshed from file"))
      ),
      Schedule.fixed(Duration.seconds(5))
    )
  ),
  Effect.scoped,
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
