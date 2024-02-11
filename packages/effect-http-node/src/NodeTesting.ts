/**
 * Testing of the `Server` implementation.
 *
 * @since 1.0.0
 */
import type { Effect, Scope } from "effect"

import type { HttpClient, HttpServer } from "@effect/platform"
import type { NodeContext } from "@effect/platform-node"
import type { Api, Client, SwaggerRouter } from "effect-http"
import * as internal from "./internal/testing.js"

/**
 * Create a testing client for the `Server`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <R, E, Endpoints extends Api.Endpoint>(
  app: HttpServer.app.Default<R, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>
) => Effect.Effect<
  Client.Client<Endpoints>,
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
    never,
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
