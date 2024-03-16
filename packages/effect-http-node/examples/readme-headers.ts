import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseBody(Schema.string),
      Api.setRequestHeaders(Schema.struct({ "x-client-id": Schema.string }))
    )
  )
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
