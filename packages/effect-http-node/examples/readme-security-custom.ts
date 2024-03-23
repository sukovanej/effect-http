import { HttpServer } from "@effect/platform"
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, Middlewares, RouterBuilder, Security, ServerError } from "effect-http"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const customSecurity = Security.make(
  pipe(
    HttpServer.request.schemaHeaders(Schema.struct({ "x-api-key": Schema.string })),
    Effect.mapError(() => ServerError.unauthorizedError("Expected valid X-API-KEY header")),
    Effect.map((headers) => headers["x-api-key"])
  ),
  { "myApiKey": { name: "X-API-KEY", type: "apiKey", in: "header", description: "My API key" } }
)

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("myRoute", "/my-route").pipe(
      Api.setResponseBody(Schema.string),
      Api.setSecurity(customSecurity)
    )
  )
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("myRoute", (_, apiKey) => Effect.succeed(`Logged as ${apiKey}`)),
  RouterBuilder.build,
  Middlewares.errorLog
)

app.pipe(NodeServer.listen({ port: 3000 }), Effect.provide(debugLogger), NodeRuntime.runMain)
