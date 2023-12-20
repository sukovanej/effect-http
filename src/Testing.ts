/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App";
import type * as PlatformClient from "@effect/platform/Http/Client";
import type * as PlatformClientError from "@effect/platform/Http/ClientError";
import type * as ClientResponse from "@effect/platform/Http/ClientResponse";
import type * as Platform from "@effect/platform/Http/Platform";
import type * as Server from "@effect/platform/Http/Server";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";

import type * as Api from "./Api.js";
import type * as Client from "./Client.js";
import type * as SwaggerRouter from "./SwaggerRouter.js";
import * as internal from "./internal/testing.js";

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
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<R, ServerRequest.ServerRequest | Scope.Scope>,
        Server.Server | Platform.Platform
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
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<R, ServerRequest.ServerRequest | Scope.Scope>,
        Server.Server | Platform.Platform
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
