/**
 * Simplified way to run a node server.
 *
 * @since 1.0.0
 */
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import type * as NodeContext from "@effect/platform-node/NodeContext"
import type * as HttpServer from "@effect/platform/HttpServer"
import type * as SwaggerRouter from "effect-http/SwaggerRouter"
import * as internal from "./internal/node-server.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  port: number | undefined
}

/**
 * @category combinators
 * @since 1.0.0
 */
export const listen: (
  options?: Partial<Options>
) => <R, E>(
  router: HttpServer.app.Default<R, E>
) => Effect.Effect<
  never,
  HttpServer.error.ServeError,
  Exclude<
    Exclude<
      Exclude<R, HttpServer.request.ServerRequest | Scope.Scope>,
      HttpServer.server.Server | HttpServer.platform.Platform | HttpServer.etag.Generator | NodeContext.NodeContext
    >,
    SwaggerRouter.SwaggerFiles
  >
> = internal.listen
