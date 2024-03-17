import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const Response = pipe(
  Schema.struct({
    name: Schema.string,
    id: pipe(Schema.number, Schema.int(), Schema.positive())
  }),
  Schema.description("User")
)
const Query = Schema.struct({
  id: pipe(Schema.NumberFromString, Schema.description("User id"))
})

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user", { description: "Returns a User by id" }).pipe(
      Api.setResponseBody(Response),
      Api.setRequestQuery(Query)
    )
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
