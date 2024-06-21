/**
 * Testing of the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import type * as NodeContext from "@effect/platform-node/NodeContext"
import type * as Etag from "@effect/platform/Etag"
import type * as HttpApp from "@effect/platform/HttpApp"
import type * as HttpClient from "@effect/platform/HttpClient"
import type * as HttpClientError from "@effect/platform/HttpClientError"
import type * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import type * as HttpPlatform from "@effect/platform/HttpPlatform"
import type * as HttpServer from "@effect/platform/HttpServer"
import type * as HttpServerRequest from "@effect/platform/HttpServerRequest"
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
  app: HttpApp.Default<E, R>,
  api: A,
  options?: Partial<Client.Options>
) => Effect.Effect<
  Client.Client<A>,
  never,
  | Scope.Scope
  | Exclude<
    Exclude<
      Exclude<
        Exclude<R, HttpServerRequest.HttpServerRequest | Scope.Scope>,
        HttpServer.HttpServer | HttpPlatform.HttpPlatform | Etag.Generator | NodeContext.NodeContext
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
  app: HttpApp.Default<E, R>
) => Effect.Effect<
  HttpClient.HttpClient<
    HttpClientResponse.HttpClientResponse,
    HttpClientError.HttpClientError,
    Scope.Scope
  >,
  never,
  | Scope.Scope
  | Exclude<
    Exclude<
      Exclude<
        Exclude<R, HttpServerRequest.HttpServerRequest | Scope.Scope>,
        HttpServer.HttpServer | HttpPlatform.HttpPlatform | Etag.Generator | NodeContext.NodeContext
      >,
      SwaggerRouter.SwaggerFiles
    >,
    NodeContext.NodeContext
  >
> = internal.makeRaw
