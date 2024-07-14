import { HttpServerRequest } from "@effect/platform"
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Logger, LogLevel, pipe } from "effect"
import { Api, HttpError, Middlewares, RouterBuilder, Security } from "effect-http"
import { NodeServer } from "effect-http-node"

const customSecurity = Security.make(
  pipe(
    HttpServerRequest.schemaHeaders(Schema.Struct({ "x-api-key": Schema.String })),
    Effect.mapError(() => HttpError.unauthorized("Expected valid X-API-KEY header")),
    Effect.map((headers) => headers["x-api-key"])
  ),
  { "myApiKey": { name: "X-API-KEY", type: "apiKey", in: "header", description: "My API key" } }
)

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("myRoute", "/my-route").pipe(
      Api.setResponseBody(Schema.String),
      Api.setSecurity(customSecurity)
    )
  )
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("myRoute", (_, apiKey) => Effect.succeed(`Logged as ${apiKey}`)),
  RouterBuilder.build,
  Middlewares.errorLog
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
