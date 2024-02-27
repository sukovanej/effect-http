import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

export const api = Api.api().pipe(
  Api.post("test", "/test", { request: { body: Schema.string } })
)

const app = ExampleServer.make(api).pipe(
  RouterBuilder.build
)

app.pipe(NodeServer.listen({ port: 3000 }), NodeRuntime.runMain)
