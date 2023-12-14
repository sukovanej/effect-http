import type * as App from "@effect/platform/Http/App";
import * as PlatformClient from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as Server from "@effect/platform/Http/Server";
import type * as Api from "effect-http/Api";
import * as Client from "effect-http/Client";
import * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const make = <R, E, Endpoints extends Api.Endpoint>(
  app: App.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>,
) =>
  Effect.gen(function* (_) {
    const allocatedUrl = yield* _(Deferred.make<never, string>());

    const { createServer } = yield* _(Effect.promise(() => import("http")));

    const NodeServer = yield* _(
      Effect.promise(() => import("@effect/platform-node/Http/Server")),
    );

    const NodeContext = yield* _(
      Effect.promise(() => import("@effect/platform-node/NodeContext")),
    );

    const NodeServerLive = NodeServer.layer(() => createServer(), {
      port: undefined,
    });

    yield* _(
      serverUrl,
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Layer.launch(Server.serve(app))),
      Effect.provide(NodeServerLive),
      Effect.provide(SwaggerRouter.SwaggerFilesLive),
      Effect.provide(NodeContext.layer),
      Effect.forkScoped,
    );

    return yield* _(
      Deferred.await(allocatedUrl),
      Effect.map((url) => Client.make(api, { baseUrl: url, ...options })),
    );
  });

export const makeRaw = <R, E>(
  app: App.Default<R | SwaggerRouter.SwaggerFiles, E>,
) =>
  Effect.gen(function* (_) {
    const allocatedUrl = yield* _(Deferred.make<never, string>());

    const { createServer } = yield* _(Effect.promise(() => import("http")));

    const NodeServer = yield* _(
      Effect.promise(() => import("@effect/platform-node/Http/Server")),
    );

    const NodeContext = yield* _(
      Effect.promise(() => import("@effect/platform-node/NodeContext")),
    );

    const NodeServerLive = NodeServer.layer(() => createServer(), {
      port: undefined,
    });

    yield* _(
      serverUrl,
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Layer.launch(Server.serve(app))),
      Effect.provide(NodeServerLive),
      Effect.provide(SwaggerRouter.SwaggerFilesLive),
      Effect.provide(NodeContext.layer),
      Effect.forkScoped,
    );

    return yield* _(
      Deferred.await(allocatedUrl),
      Effect.map((url) =>
        PlatformClient.fetch().pipe(
          PlatformClient.mapRequest(ClientRequest.prependUrl(url)),
        ),
      ),
    );
  });

/** @internal */
const serverUrl = Effect.map(Server.Server, (server) => {
  const address = server.address;

  if (address._tag === "UnixAddress") {
    return address.path;
  }

  return `http://localhost:${address.port}`;
});
