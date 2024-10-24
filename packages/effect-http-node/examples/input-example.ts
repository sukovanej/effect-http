import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, pipe, Schema } from "effect"
import { Api, HttpError, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const api = pipe(
  Api.make({ title: "My api" }),
  Api.addEndpoint(
    Api.get("stuff", "/stuff").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestQuery(Schema.Struct({ value: Schema.String }))
    )
  )
)

const stuffHandler = RouterBuilder.handler(api, "stuff", ({ query }) =>
  pipe(
    Effect.fail(HttpError.notFound("I didnt find it")),
    Effect.tap(() => Effect.log(`Received ${query.value}`))
  ))

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle(stuffHandler),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
