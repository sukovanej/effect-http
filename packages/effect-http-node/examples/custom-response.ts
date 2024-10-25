import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, pipe, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.Number),
      Api.setResponseHeaders(Schema.Struct({ "x-hello-world": Schema.String }))
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle(
    "hello",
    () => Effect.succeed({ body: 12, headers: { "x-hello-world": "test" }, status: 201 as const })
  ),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
