import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { HttpServer } from "@effect/platform"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const api = Api.api().pipe(
  Api.get("handle", "/api/handle", {
    response: Schema.string
  })
)

const StaticFilesMiddleware = HttpServer.middleware.make((app) =>
  Effect.gen(function*(_) {
    const request = yield* _(HttpServer.request.ServerRequest)

    if (request.url.startsWith("/api")) {
      return yield* _(app)
    }

    return yield* _(
      HttpServer.response.file(request.url.replace("/", "")),
      Effect.orElse(() => HttpServer.response.text("Not found", { status: 404 }))
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
