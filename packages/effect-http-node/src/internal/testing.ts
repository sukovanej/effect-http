import { HttpClient, HttpServer } from "@effect/platform"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import { Deferred, Effect, Layer } from "effect"
import { Client } from "effect-http"
import type { Api, SwaggerRouter } from "effect-http"
import { createServer } from "http"
import * as NodeSwaggerFiles from "../NodeSwaggerFiles.js"

export const make = <R, E, Endpoints extends Api.Endpoint>(
  app: HttpServer.app.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>
) =>
  Effect.gen(function*(_) {
    const allocatedUrl = yield* _(Deferred.make<string>())

    const NodeServerLive = NodeHttpServer.server.layer(() => createServer(), {
      port: undefined
    })

    yield* _(
      serverUrl,
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Layer.launch(HttpServer.server.serve(app))),
      Effect.provide(NodeServerLive),
      Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
      Effect.provide(NodeContext.layer),
      Effect.forkScoped
    )

    return yield* _(
      Deferred.await(allocatedUrl),
      Effect.map((url) =>
        Client.make(
          api,
          { baseUrl: url, ...options, httpClient: HttpClient.client.fetch({ keepalive: false }) }
        )
      )
    )
  })

export const makeRaw = <R, E>(
  app: HttpServer.app.Default<R | SwaggerRouter.SwaggerFiles, E>
) =>
  Effect.gen(function*(_) {
    const allocatedUrl = yield* _(Deferred.make<string>())

    const NodeServerLive = NodeHttpServer.server.layer(() => createServer(), {
      port: undefined
    })

    yield* _(
      serverUrl,
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Layer.launch(HttpServer.server.serve(app))),
      Effect.provide(NodeServerLive),
      Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
      Effect.provide(NodeContext.layer),
      Effect.forkScoped
    )

    return yield* _(
      Deferred.await(allocatedUrl),
      Effect.map((url) =>
        HttpClient.client.fetch({ keepalive: false }).pipe(
          HttpClient.client.mapRequest(HttpClient.request.prependUrl(url))
        )
      )
    )
  })

/** @internal */
const serverUrl = Effect.map(HttpServer.server.Server, (server) => {
  const address = server.address

  if (address._tag === "UnixAddress") {
    return address.path
  }

  return `http://localhost:${address.port}`
})
