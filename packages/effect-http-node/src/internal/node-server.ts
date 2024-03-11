import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import * as HttpServer from "@effect/platform/HttpServer"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { createServer } from "http"
import type * as NodeServer from "../NodeServer.js"
import * as NodeSwaggerFiles from "../NodeSwaggerFiles.js"

const DEFAULT_LISTEN_OPTIONS: NodeServer.Options = {
  port: undefined
}

/**
 * @category combinators
 * @since 1.0.0
 */
export const listen = (options?: Partial<NodeServer.Options>) => <R, E>(router: HttpServer.app.Default<R, E>) =>
  pipe(
    Effect.gen(function*(_) {
      const server = yield* _(HttpServer.server.Server)
      const address = server.address._tag === "UnixAddress"
        ? server.address.path
        : `${server.address.hostname}:${server.address.port}`

      yield* _(Effect.log(`Listening on ${address}`))
    }),
    Effect.flatMap(() => Layer.launch(HttpServer.server.serve(router))),
    Effect.scoped,
    Effect.provide(NodeHttpServer.server.layer(() => createServer(), { ...DEFAULT_LISTEN_OPTIONS, ...options })),
    Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
    Effect.provide(NodeContext.layer)
  )
