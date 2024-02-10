import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.api({ title: "My awesome pets API", version: "1.0.0" }),
  Api.get("test", "/test", {
    response: Schema.string,
    request: {
      query: Schema.struct({
        value: pipe(Schema.string, Schema.pattern(/[A-Z]/))
      })
    }
  })
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
