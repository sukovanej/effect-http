/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as FileSystem from "@effect/platform/FileSystem";
import type * as App from "@effect/platform/Http/App";
import type * as PlatformClient from "@effect/platform/Http/Client";
import type * as PlatformClientError from "@effect/platform/Http/ClientError";
import type * as ClientResponse from "@effect/platform/Http/ClientResponse";
import type * as Server from "@effect/platform/Http/Server";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as Path from "@effect/platform/Path";
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
  app: App.Default<R, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>,
) => Effect.Effect<
  | Server.Server
  | FileSystem.FileSystem
  | Path.Path
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>,
        SwaggerRouter.SwaggerFiles
      >,
      SwaggerRouter.SwaggerFiles
    >,
  never,
  Client.Client<Endpoints>
> = internal.make;

/**
 * Create a testing client for the `Server`. Instead of the `Client.Client` interface
 * it returns a raw *@effect/platform/Http/Client* `Client` with base url set.
 *
 * @category constructors
 * @since 1.0.0
 */
export const makeRaw: <R, E>(
  app: App.Default<R, E>,
) => Effect.Effect<
  | Server.Server
  | FileSystem.FileSystem
  | Path.Path
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>,
        SwaggerRouter.SwaggerFiles
      >,
      SwaggerRouter.SwaggerFiles
    >,
  never,
  PlatformClient.Client<
    never,
    PlatformClientError.HttpClientError,
    ClientResponse.ClientResponse
  >
> = internal.makeRaw;
