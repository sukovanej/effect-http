import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const SchemaBooleanFromString = pipe(
  Schema.literal("true", "false"),
  Schema.transform(
    Schema.boolean,
    (i) => i === "true",
    (o) => (o ? "true" : "false")
  )
)

export const api = pipe(
  Api.api(),
  Api.get("userById", "/api/users/:userId", {
    response: Schema.struct({ name: Schema.string }),
    request: {
      params: Schema.struct({
        userId: Schema.string
      }),
      query: Schema.struct({
        include_deleted: Schema.optional(SchemaBooleanFromString)
      }),
      headers: Schema.struct({
        authorization: Schema.string
      })
    }
  })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("userById", ({ query: { include_deleted } }) =>
    Effect.succeed({
      name: `include_deleted = ${include_deleted ?? "[not set]"}`
    })),
  RouterBuilder.build
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
