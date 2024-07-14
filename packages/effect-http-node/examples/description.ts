import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Logger, LogLevel, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const Response = pipe(
  Schema.Struct({
    name: Schema.String,
    id: pipe(Schema.Number, Schema.int(), Schema.positive())
  }),
  Schema.annotations({ description: "User" })
)
const Query = Schema.Struct({
  id: pipe(Schema.NumberFromString, Schema.annotations({ description: "User id" }))
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
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
