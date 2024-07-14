import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Logger, LogLevel, pipe } from "effect"
import { Api, ApiResponse, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const helloEndpoint = Api.post("hello", "/hello").pipe(
  Api.setResponseBody(Schema.Number),
  Api.setResponseHeaders(Schema.Struct({
    "my-header": pipe(
      Schema.NumberFromString,
      Schema.annotations({ description: "My header" })
    )
  })),
  Api.addResponse(ApiResponse.make(201, Schema.Number)),
  Api.addResponse({ status: 204, headers: Schema.Struct({ "x-another": Schema.NumberFromString }) })
)

const api = pipe(
  Api.make(),
  Api.addEndpoint(helloEndpoint)
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", () => Effect.succeed({ body: 12, headers: { "my-header": 69 }, status: 201 as const })),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
