/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App";
import type * as Platform from "@effect/platform/Http/Platform";
import type * as PlatformServer from "@effect/platform/Http/Server";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as Api from "effect-http/Api";
import type * as Client from "effect-http/Client";
import type * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as internal from "effect-http/internal/testing";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";

/**
 * Create a testing client for the `Server`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <R, E, Endpoints extends Api.Endpoint>(
  app: App.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>,
) => Effect.Effect<
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<R, ServerRequest.ServerRequest>,
        PlatformServer.Server | Platform.Platform
      >,
      SwaggerRouter.SwaggerFiles
    >,
  never,
  Client.Client<Endpoints>
> = internal.make;
