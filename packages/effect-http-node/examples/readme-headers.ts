import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const api = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: Schema.string,
    request: {
      headers: Schema.struct({ "X-Client-Id": Schema.string })
    }
  })
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
