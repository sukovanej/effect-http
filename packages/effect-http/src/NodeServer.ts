/**
 * Simplified way to run a node server.
 *
 * @since 1.0.0
 */
import type * as NodeContext from "@effect/platform-node/NodeContext"
import type * as App from "@effect/platform/Http/App"
import type * as Etag from "@effect/platform/Http/Etag"
import type * as Platform from "@effect/platform/Http/Platform"
import type * as Server from "@effect/platform/Http/Server"
import type * as ServeError from "@effect/platform/Http/ServerError"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import * as internal from "./internal/node-server.js"
import type * as SwaggerRouter from "./SwaggerRouter.js"

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
  router: App.Default<R, E>
) => Effect.Effect<
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
> = internal.listen
