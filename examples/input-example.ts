import { runMain } from "@effect/platform-node/Runtime"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, NodeServer, RouterBuilder, ServerError } from "effect-http"

import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.api({ title: "My api" }),
  Api.get("stuff", "/stuff", {
    response: Schema.string,
    request: {
      query: Schema.struct({ value: Schema.string })
    }
  })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("stuff", ({ query }) =>
    pipe(
      Effect.fail(ServerError.notFoundError("I didnt find it")),
      Effect.tap(() => Effect.log(`Received ${query.value}`))
    )),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  runMain
)
