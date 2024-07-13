/**
 * Testing of the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as NodeContext from "@effect/platform-node/NodeContext"
import type * as Etag from "@effect/platform/Etag"
import type * as HttpApp from "@effect/platform/HttpApp"
import type * as HttpClient from "@effect/platform/HttpClient"
import type * as HttpPlatform from "@effect/platform/HttpPlatform"
import type * as HttpServer from "@effect/platform/HttpServer"
import type * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import type * as Api from "effect-http/Api"
import type * as ApiEndpoint from "effect-http/ApiEndpoint"
import type * as Client from "effect-http/Client"
import type * as Handler from "effect-http/Handler"
import type * as SwaggerRouter from "effect-http/SwaggerRouter"

import * as internal from "./internal/node-testing.js"

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
  HttpClient.HttpClient.Default,
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

/**
 * Testing of `Handler.Handler<A, E, R>`.
 *
 * @example
 * import { HttpClientRequest } from "@effect/platform"
 * import { Schema } from "@effect/schema"
 * import { Effect } from "effect"
 * import { Api, Handler } from "effect-http"
 * import { NodeTesting } from "effect-http-node"
 *
 * const myEndpoint = Api.get("myEndpoint", "/my-endpoint").pipe(
 *   Api.setResponseBody(Schema.Struct({ hello: Schema.String }))
 * )
 *
 * const myHandler = Handler.make(myEndpoint, () => Effect.succeed({ hello: "world" }))
 *
 * Effect.gen(function*() {
 *   const client = yield* NodeTesting.handler(myHandler)
 *   const response = yield* client(HttpClientRequest.get("/my-endpoint"))
 *
 *   assert.deepStrictEqual(response.status, 200)
 *   assert.deepStrictEqual(yield* response.json, { hello: "world" })
 * }).pipe(Effect.scoped, Effect.runFork)
 *
 * @category constructors
 * @since 1.0.0
 */
export const handler: <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  app: Handler.Handler<A, E, R>
) => Effect.Effect<
  HttpClient.HttpClient.Default,
  never,
  | Scope.Scope
  | Exclude<
    Exclude<
      Exclude<R, HttpServerRequest.HttpServerRequest | Scope.Scope>,
      HttpServer.HttpServer | HttpPlatform.HttpPlatform | Etag.Generator | NodeContext.NodeContext
    >,
    NodeContext.NodeContext
  >
> = internal.handler
