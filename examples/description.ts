import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, NodeServer, RouterBuilder } from "effect-http"

import { debugLogger } from "./_utils.js"

const responseSchema = pipe(
  Schema.struct({
    name: Schema.string,
    id: pipe(Schema.number, Schema.int(), Schema.positive())
  }),
  Schema.description("User")
)
const querySchema = Schema.struct({
  id: pipe(Schema.NumberFromString, Schema.description("User id"))
})

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get(
    "getUser",
    "/user",
    {
      response: responseSchema,
      request: {
        query: querySchema
      }
    },
    { description: "Returns a User by id" }
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: "mike", id: query.id })),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
