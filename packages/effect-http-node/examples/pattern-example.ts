import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.make({ title: "My awesome pets API", version: "1.0.0" }),
  Api.addEndpoint(
    Api.get("test", "/test").pipe(
      Api.setResponseBody(Schema.string),
      Api.setRequestQuery(Schema.struct({ value: Schema.string }))
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
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
