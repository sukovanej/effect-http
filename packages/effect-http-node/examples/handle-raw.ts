import { HttpServer } from "@effect/platform"
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"
import { PrettyLogger } from "effect-log"

export const api = Api.make({ title: "Example API" }).pipe(
  Api.addEndpoint(
    Api.get("root", "/").pipe(
      Api.setResponseBody(Schema.string),
      Api.setResponseHeaders(Schema.struct({ "Content-Type": Schema.string }))
    )
  )
)

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handleRaw(
    "root",
    HttpServer.response.text("Hello World!", {
      status: 200 as const,
      headers: HttpServer.headers.fromInput({ "content-type": "text/plain" })
    })
  ),
  RouterBuilder.build
)

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer())
)

NodeRuntime.runMain(program)
