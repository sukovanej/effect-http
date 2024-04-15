import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Option, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const Response = Schema.Struct({
  foo: Schema.optional(Schema.String, { as: "Option" }),
  bar: Schema.Option(Schema.String)
})

const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(Api.setResponseBody(Response))
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", () => Effect.succeed({ foo: Option.none(), bar: Option.none() })),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 4000 }),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
