import { runMain } from "@effect/platform-node/Runtime"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http"

import { debugLogger } from "./_utils.js"

const responseSchema = Schema.struct({
  name: Schema.string,
  value: Schema.number
})

const api = pipe(
  Api.api({ servers: ["http://localhost:3000", { description: "hello", url: "/api/" }] }),
  Api.get("test", "/test", { response: responseSchema })
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  runMain
)
