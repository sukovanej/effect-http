import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, pipe, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const api = pipe(
  Api.make({ title: "My awesome pets API", version: "1.0.0" }),
  Api.addEndpoint(
    Api.get("test", "/test").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestQuery(Schema.Struct({ value: Schema.String }))
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("test", ({ query }) => Effect.succeed(`test ${query.value}`)),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 4000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
