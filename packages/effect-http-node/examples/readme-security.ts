import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const mySecuredEnpoint = Api.post("security", "/testSecurity", { description: "" }).pipe(
  Api.setResponseBody(Schema.string),
  Api.addSecurity(
    "myAwesomeBearerAuth", // arbitrary name for the security scheme
    {
      type: "http",
      options: {
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      // Schema<any, string> for decoding-encoding the significant part
      // "Authorization: Bearer <significant part>"
      schema: Schema.Secret
    }
  )
)

const api = Api.make().pipe(
  Api.addEndpoint(mySecuredEnpoint)
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("security", (_, security) => {
    const token = security.myAwesomeBearerAuth.token // Secret
    return Effect.succeed(`your token ${token}`)
  }),
  RouterBuilder.build
)

app.pipe(NodeServer.listen(), NodeRuntime.runMain)
