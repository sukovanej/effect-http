import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Option, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const Response = Schema.struct({
  foo: Schema.optional(Schema.string, { as: "Option" }),
  bar: Schema.option(Schema.string)
})

const api = pipe(
  Api.api(),
  Api.get("hello", "/hello", {
    response: Response
  })
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
