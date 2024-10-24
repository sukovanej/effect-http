import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, pipe, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("handle", "/api/handle").pipe(Api.setResponseBody(Schema.String))
  )
)

const StaticFilesMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function*() {
    const request = yield* HttpServerRequest.HttpServerRequest

    if (request.url.startsWith("/api")) {
      return yield* app
    }

    return yield* pipe(
      HttpServerResponse.file(request.url.replace("/", "")),
      Effect.orElse(() => HttpServerResponse.text("Not found", { status: 404 }))
    )
  })
)

const app = RouterBuilder.make(api, { enableDocs: true }).pipe(
  RouterBuilder.handle("handle", () => Effect.succeed("Hello World")),
  RouterBuilder.build,
  StaticFilesMiddleware
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(NodeContext.layer),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
