import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpServer from "@effect/platform/HttpServer"
import type * as Api from "effect-http/Api"
import * as Client from "effect-http/Client"
import type * as SwaggerRouter from "effect-http/SwaggerRouter"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { createServer } from "http"
import * as NodeSwaggerFiles from "../NodeSwaggerFiles.js"

/** @internal */
const NodeServerLive = NodeHttpServer.server.layer(() => createServer(), {
  port: undefined
})

/** @internal */
const startTestServer = <R, E>(
  app: HttpServer.app.Default<R | SwaggerRouter.SwaggerFiles, E>
) =>
  Effect.flatMap(Deferred.make<string>(), (allocatedUrl) =>
    serverUrl.pipe(
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Layer.launch(HttpServer.server.serve(app))),
      Effect.provide(NodeServerLive),
      Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
      Effect.provide(NodeContext.layer),
      Effect.forkScoped,
      Effect.flatMap(() => Deferred.await(allocatedUrl))
    ))

/** @internal */
export const make = <R, E, A extends Api.Api.Any>(
  app: HttpServer.app.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: A,
  options?: Partial<Client.Options>
) =>
  Effect.map(startTestServer(app), (url) =>
    Client.make(api, {
      ...options,
      httpClient: (options?.httpClient ?? HttpClient.client.fetch).pipe(
        HttpClient.client.mapRequest(HttpClient.request.prependUrl(url)),
        HttpClient.client.transformResponse(
          HttpClient.client.withFetchOptions({ keepalive: false })
        )
      )
    }))

/** @internal */
export const makeRaw = <R, E>(
  app: HttpServer.app.Default<E, R | SwaggerRouter.SwaggerFiles>
) =>
  Effect.map(startTestServer(app), (url) =>
    HttpClient.client.fetch.pipe(
      HttpClient.client.mapRequest(HttpClient.request.prependUrl(url)),
      HttpClient.client.transformResponse(
        HttpClient.client.withFetchOptions({ keepalive: false })
      )
    ))

/** @internal */
const serverUrl = Effect.map(HttpServer.server.Server, (server) => {
  const address = server.address

  if (address._tag === "UnixAddress") {
    return address.path
  }

  return `http://localhost:${address.port}`
})
