import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { HttpError } from "effect-http-error"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

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
    Effect.fail(HttpError.notFoundError("I didnt find it")),
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
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
