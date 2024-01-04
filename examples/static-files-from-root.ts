import { NodeContext, Runtime } from "@effect/platform-node"
import * as Http from "@effect/platform/HttpServer"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, NodeServer, RouterBuilder } from "effect-http"

import { debugLogger } from "./_utils.js"

const api = Api.api().pipe(
  Api.get("handle", "/api/handle", {
    response: Schema.string
  })
)

const StaticFilesMiddleware = Http.middleware.make((app) =>
  Effect.gen(function*(_) {
    const request = yield* _(Http.request.ServerRequest)

    if (request.url.startsWith("/api")) {
      return yield* _(app)
    }

    return yield* _(
      Http.response.file(request.url.replace("/", "")),
      Effect.orElse(() => Http.response.text("Not found", { status: 404 }))
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
  Runtime.runMain
)
