import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.make(),
  Api.addEndpoint(
    pipe(
      Api.get("hello", "/hello"),
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.number),
      Api.setResponseHeaders(Schema.struct({ "x-hello-world": Schema.string }))
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
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
