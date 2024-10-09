import { createServer } from "http"

import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import type * as HttpApp from "@effect/platform/HttpApp"
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpServer from "@effect/platform/HttpServer"
import * as Context from "effect/Context"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type * as Scope from "effect/Scope"

import type * as Api from "effect-http/Api"
import type * as ApiEndpoint from "effect-http/ApiEndpoint"
import * as Client from "effect-http/Client"
import * as Handler from "effect-http/Handler"
import type * as SwaggerRouter from "effect-http/SwaggerRouter"

import * as NodeSwaggerFiles from "../NodeSwaggerFiles.js"

/** @internal */
const defaultHttpClient = FetchHttpClient.layer.pipe(
  Layer.build,
  Effect.map(Context.get(HttpClient.HttpClient)),
  Effect.scoped,
  Effect.runSync
)

/** @internal */
export const make = <R, E, A extends Api.Api.Any>(
  app: HttpApp.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: A,
  options?: Partial<Client.Options>
) =>
  startTestServer(app).pipe(
    Effect.map((url) =>
      Client.make(api, {
        ...options,
        httpClient: makeHttpClient(options?.httpClient ?? defaultHttpClient, url)
      })
    ),
    Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
    Effect.provide(NodeContext.layer)
  )

/** @internal */
export const makeRaw = <R, E>(
  app: HttpApp.Default<E, R | SwaggerRouter.SwaggerFiles>
) =>
  startTestServer(app).pipe(
    Effect.map((url) => makeHttpClient(defaultHttpClient, url)),
    Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
    Effect.provide(NodeContext.layer)
  )

/** @internal */
export const handler = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler.Handler<A, E, R>
) =>
  startTestServer(Handler.getRouter(handler)).pipe(
    Effect.map((url) => makeHttpClient(defaultHttpClient, url)),
    Effect.provide(NodeContext.layer)
  )

/** @internal */
const startTestServer = <R, E>(
  app: HttpApp.Default<R | SwaggerRouter.SwaggerFiles, E>
) =>
  Effect.flatMap(Deferred.make<string>(), (allocatedUrl) =>
    serverUrl.pipe(
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Layer.launch(HttpServer.serve(app))),
      Effect.provide(NodeHttpServer.layer(createServer, { port: undefined })),
      Effect.forkScoped,
      Effect.flatMap(() => Deferred.await(allocatedUrl))
    ))

/** @internal */
const makeHttpClient = (client: HttpClient.HttpClient, url: string) =>
  client.pipe(
    HttpClient.mapRequest(HttpClientRequest.prependUrl(url)),
    HttpClient.transformResponse(
      Effect.mapInputContext((ctx: Context.Context<Scope.Scope>) => {
        const init = ctx.unsafeMap.get(FetchHttpClient.RequestInit.key) ?? {}
        return Context.add(ctx, FetchHttpClient.RequestInit, { keepalive: false, ...init })
      })
    )
  )

/** @internal */
const serverUrl = Effect.map(HttpServer.HttpServer, (server) => {
  const address = server.address

  if (address._tag === "UnixAddress") {
    return address.path
  }

  return `http://localhost:${address.port}`
})
