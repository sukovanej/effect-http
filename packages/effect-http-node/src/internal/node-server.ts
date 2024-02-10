import type * as NodeContext from "@effect/platform-node/NodeContext"
import type * as App from "@effect/platform/Http/App"
import type * as Etag from "@effect/platform/Http/Etag"
import type * as Platform from "@effect/platform/Http/Platform"
import * as Server from "@effect/platform/Http/Server"
import type * as ServeError from "@effect/platform/Http/ServerError"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import { SwaggerRouter } from "effect-http"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import type * as Scope from "effect/Scope"
import type * as NodeServer from "../NodeServer.js"

const DEFAULT_LISTEN_OPTIONS: NodeServer.Options = {
  port: undefined
}

/**
 * @category combinators
 * @since 1.0.0
 */
export const listen = (options?: Partial<NodeServer.Options>) =>
<R, E>(
  router: App.Default<R, E>
): Effect.Effect<
  never,
  ServeError.ServeError,
  Exclude<
    Exclude<
      Exclude<
        Exclude<Exclude<R, ServerRequest.ServerRequest | Scope.Scope>, Scope.Scope>,
        Server.Server | Platform.Platform | Etag.Generator | NodeContext.NodeContext
      >,
      SwaggerRouter.SwaggerFiles
    >,
    NodeContext.NodeContext
  >
> =>
  Effect.gen(function*(_) {
    const _options = { ...DEFAULT_LISTEN_OPTIONS, ...options }

    const NodeServer = yield* _(
      Effect.promise(() => import("@effect/platform-node/Http/Server"))
    )

    const NodeContext = yield* _(
      Effect.promise(() => import("@effect/platform-node/NodeContext"))
    )

    const { createServer } = yield* _(Effect.promise(() => import("http")))

    const NodeServerLive = NodeServer.layer(() => createServer(), _options)

    return yield* _(
      pipe(
        Effect.gen(function*(_) {
          const server = yield* _(Server.Server)
          const address = server.address._tag === "UnixAddress"
            ? server.address.path
            : `${server.address.hostname}:${server.address.port}`

          yield* _(Effect.log(`Listening on ${address}`))
        }),
        Effect.flatMap(() => Layer.launch(Server.serve(router))),
        Effect.scoped,
        Effect.provide(NodeServerLive),
        Effect.provide(SwaggerRouter.SwaggerFilesLive),
        Effect.provide(NodeContext.layer)
      )
    )
  })
