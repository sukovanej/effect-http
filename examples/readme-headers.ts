import { runMain } from "@effect/platform-node/Runtime"
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http"

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
  runMain
)
