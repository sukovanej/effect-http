/**
 * Simplified way to run a node server.
 *
 * @since 1.0.0
 */
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import type * as NodeContext from "@effect/platform-node/NodeContext"
import type * as Etag from "@effect/platform/Etag"
import type * as HttpApp from "@effect/platform/HttpApp"
import type * as HttpPlatform from "@effect/platform/HttpPlatform"
import type * as HttpServer from "@effect/platform/HttpServer"
import type * as HttpServerError from "@effect/platform/HttpServerError"
import type * as HttpServerRequest from "@effect/platform/HttpServerRequest"
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
  router: HttpApp.Default<E, R>
) => Effect.Effect<
  never,
  HttpServerError.ServeError,
  Exclude<
    Exclude<
      Exclude<R, HttpServerRequest.HttpServerRequest | Scope.Scope>,
      HttpServer.HttpServer | HttpPlatform.HttpPlatform | Etag.Generator | NodeContext.NodeContext
    >,
    SwaggerRouter.SwaggerFiles
  >
> = internal.listen
