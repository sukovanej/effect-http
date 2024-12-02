import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, pipe, Schema } from "effect"
import { Api, HttpError, Representation, RouterBuilder } from "effect-http"

import type { Multipart } from "@effect/platform"
import { FileSystem, HttpServerRequest } from "@effect/platform"
import { NodeServer } from "effect-http-node"

const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.post("upload", "/upload").pipe(
      Api.setRequestBody(Api.FormData),
      Api.setResponseBody(Schema.String),
      Api.setResponseRepresentations([Representation.plainText])
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("upload", () =>
    Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest
      const formData = yield* request.multipart

      const file = formData["file"]

      if (typeof file === "string") {
        return yield* HttpError.badRequest("File not found")
      }

      const fs = yield* FileSystem.FileSystem
      return yield* fs.readFileString((file[0] as Multipart.PersistedFile).path)
    }).pipe(Effect.scoped)),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
