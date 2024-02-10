import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, NodeServer, Representation, RouterBuilder, ServerError } from "effect-http"

import { FileSystem, HttpServer } from "@effect/platform"
import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.api(),
  Api.post("upload", "/upload", {
    request: {
      body: Api.FormData
    },
    response: {
      status: 200,
      content: Schema.string,
      representations: [Representation.plainText]
    }
  })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("upload", () =>
    Effect.gen(function*(_) {
      const request = yield* _(HttpServer.request.ServerRequest)
      const formData = yield* _(request.multipart)

      const file = formData["file"]

      if (typeof file === "string") {
        return yield* _(ServerError.badRequest("File not found"))
      }

      const fs = yield* _(FileSystem.FileSystem)
      const content = yield* _(fs.readFileString(file[0].path))
      return { status: 200 as const, content }
    }).pipe(Effect.scoped)),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
