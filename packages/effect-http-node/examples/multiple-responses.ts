import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, ApiResponse, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const helloEndpoint = Api.post("hello", "/hello").pipe(
  Api.setRequestHeaders(Schema.struct({
    "User-Agent": pipe(
      Schema.NumberFromString,
      Schema.description("Identifier of the user")
    )
  })),
  Api.setResponseBody(Schema.number),
  Api.setResponseHeaders(Schema.struct({
    "my-header": pipe(
      Schema.NumberFromString,
      Schema.description("My header")
    )
  })),
  Api.addResponse(ApiResponse.make(201, Schema.number)),
  Api.addResponse({ status: 204, headers: Schema.struct({ "x-another": Schema.NumberFromString }) })
)

const api = pipe(
  Api.make(),
  Api.addEndpoint(
    helloEndpoint
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", () => Effect.succeed({ body: 12, headers: { "my-header": 69 }, status: 201 as const })),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
