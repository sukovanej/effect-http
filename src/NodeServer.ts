/**
 * Simplified way to run a node server.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App";
import type * as Platform from "@effect/platform/Http/Platform";
import type * as Server from "@effect/platform/Http/Server";
import type * as ServeError from "@effect/platform/Http/ServerError";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as internal from "effect-http/internal/node-server";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  port: number | undefined;
}

/**
 * @category combinators
 * @since 1.0.0
 */
export const listen: (
  options?: Partial<Options>,
) => <R, E>(
  router: App.Default<R, E>,
) => Effect.Effect<
  Exclude<
    Exclude<
      Exclude<R, ServerRequest.ServerRequest | Scope.Scope>,
      Server.Server | Platform.Platform
    >,
    SwaggerRouter.SwaggerFiles
  >,
  ServeError.ServeError,
  never
> = internal.listen;
