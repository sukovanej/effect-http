/**
 * Testing of the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import type { NodeContext } from "@effect/platform-node"
import type * as HttpClient from "@effect/platform/HttpClient"
import type * as HttpServer from "@effect/platform/HttpServer"
import type * as Api from "effect-http/Api"
import type * as Client from "effect-http/Client"
import type * as SwaggerRouter from "effect-http/SwaggerRouter"
import * as internal from "./internal/testing.js"

/**
 * Create a testing client for the `Server`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <R, E, A extends Api.Api.Any>(
  app: HttpServer.app.Default<R, E>,
  api: A,
  options?: Partial<Client.Options>
) => Effect.Effect<
  Client.Client<A>,
  never,
  | Scope.Scope
  | Exclude<
    Exclude<
      Exclude<
        Exclude<R, HttpServer.request.ServerRequest | Scope.Scope>,
        HttpServer.server.Server | HttpServer.platform.Platform | HttpServer.etag.Generator | NodeContext.NodeContext
      >,
      SwaggerRouter.SwaggerFiles
    >,
    NodeContext.NodeContext
  >
> = internal.make

/**
 * Create a testing client for the `Server`. Instead of the `Client.Client` interface
 * it returns a raw *@effect/platform/Http/Client* `Client` with base url set.
 *
 * @category constructors
 * @since 1.0.0
 */
export const makeRaw: <R, E>(
  app: HttpServer.app.Default<R, E>
) => Effect.Effect<
  HttpClient.client.Client<
    Scope.Scope,
    HttpClient.error.HttpClientError,
    HttpClient.response.ClientResponse
  >,
  never,
  | Scope.Scope
  | Exclude<
    Exclude<
      Exclude<
        Exclude<R, HttpServer.request.ServerRequest | Scope.Scope>,
        HttpServer.server.Server | HttpServer.platform.Platform | HttpServer.etag.Generator | NodeContext.NodeContext
      >,
      SwaggerRouter.SwaggerFiles
    >,
    NodeContext.NodeContext
  >
> = internal.makeRaw
