/**
 * Simplified way to run a server.
 *
 * @since 1.0.0
 */
import type * as FileSystem from "@effect/platform/FileSystem";
import type * as App from "@effect/platform/Http/App";
import type * as Server from "@effect/platform/Http/Server";
import type * as ServeError from "@effect/platform/Http/ServerError";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as Path from "@effect/platform/Path";
import type * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as internal from "effect-http/internal/server";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";

/**
 * @category combinators
 * @since 1.0.0
 */
export const serve: <R, E>(
  router: App.Default<R, E>,
) => Effect.Effect<
  | Server.Server
  | FileSystem.FileSystem
  | Path.Path
  | Exclude<
      Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>,
      SwaggerRouter.SwaggerFiles
    >,
  ServeError.ServeError,
  never
> = internal.serve;
