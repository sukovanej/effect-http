import { NodeRuntime } from "@effect/platform-node"
import { pipe, Schema } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestHeaders(Schema.Struct({ "x-client-id": Schema.String }))
    )
  )
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
