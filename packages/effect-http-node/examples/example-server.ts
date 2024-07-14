import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Logger, LogLevel, pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const Response = Schema.Struct({
  name: Schema.String,
  value: Schema.Number
})

const api = pipe(
  Api.make({ servers: ["http://localhost:3000", { description: "hello", url: "/api/" }] }),
  Api.addEndpoint(
    Api.get("test", "/test").pipe(Api.setResponseBody(Response))
  )
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
