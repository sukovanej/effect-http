import { NodeRuntime } from "@effect/platform-node"
import { Effect, Schema } from "effect"
import { Api, RouterBuilder, Security } from "effect-http"
import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("mySecuredEndpoint", "/my-secured-endpoint").pipe(
      Api.setResponseBody(Schema.String),
      Api.setSecurity(Security.basic())
    )
  )
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(
    "mySecuredEndpoint",
    (_, security) => Effect.succeed(`Accessed as ${security.user}`)
  ),
  RouterBuilder.build
)

app.pipe(NodeServer.listen({ port: 3000 }), NodeRuntime.runMain)
