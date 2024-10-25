import { Headers, HttpServerResponse } from "@effect/platform"
import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

export const api = Api.make({ title: "Example API" }).pipe(
  Api.addEndpoint(
    Api.get("root", "/").pipe(
      Api.setResponseBody(Schema.String),
      Api.setResponseHeaders(Schema.Struct({ "Content-Type": Schema.String }))
    )
  )
)

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handleRaw(
    "root",
    HttpServerResponse.text("Hello World!", {
      status: 200 as const,
      headers: Headers.fromInput({ "content-type": "text/plain" })
    })
  ),
  RouterBuilder.build
)

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty)
)

NodeRuntime.runMain(program)
