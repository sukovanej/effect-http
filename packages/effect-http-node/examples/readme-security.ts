import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, RouterBuilder, Security } from "effect-http"
import { NodeServer } from "effect-http-node"

const mySecuredEnpoint = Api.post("security", "/testSecurity", { description: "" }).pipe(
  Api.setResponseBody(Schema.string),
  Api.setSecurity(Security.bearer())
)

const api = Api.make().pipe(
  Api.addEndpoint(mySecuredEnpoint)
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("security", (_, token) => {
    return Effect.succeed(`your token ${token}`) // Secret
  }),
  RouterBuilder.build
)

app.pipe(NodeServer.listen(), NodeRuntime.runMain)
