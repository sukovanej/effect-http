import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
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
  NodeRuntime.runMain
)
