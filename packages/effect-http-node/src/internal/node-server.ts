import { HttpServer } from "@effect/platform"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import { Effect, Layer, pipe } from "effect"
import { SwaggerRouter } from "effect-http"
import { createServer } from "http"
import type * as NodeServer from "../NodeServer.js"

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
    Effect.provide(SwaggerRouter.SwaggerFilesLive),
    Effect.provide(NodeContext.layer)
  )
