import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from "@effect/platform"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

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
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
