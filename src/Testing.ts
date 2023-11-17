/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import type * as PlatformNodeServer from "@effect/platform-node/Http/Server";
import type * as App from "@effect/platform/Http/App";
import type * as Platform from "@effect/platform/Http/Platform";
import * as Server from "@effect/platform/Http/Server";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as Api from "effect-http/Api";
import * as Client from "effect-http/Client";
import * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";

/**
 * Create a testing client for the `Server`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make = <R, E, Endpoints extends Api.Endpoint>(
  app: App.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>,
): Effect.Effect<
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<R, ServerRequest.ServerRequest>,
        PlatformNodeServer.Server | Platform.Platform
      >,
      SwaggerRouter.SwaggerFiles
    >,
  never,
  Client.Client<Endpoints>
> =>
  Effect.gen(function* (_) {
    const allocatedUrl = yield* _(Deferred.make<never, string>());

    const { createServer } = yield* _(Effect.promise(() => import("http")));

    const NodeServer = yield* _(
      Effect.promise(() => import("@effect/platform-node/Http/Server")),
    );

    const NodeServerLive = NodeServer.layer(() => createServer(), {
      port: undefined,
    });

    yield* _(
      serverUrl,
      Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
      Effect.flatMap(() => Server.serve(app)),
      Effect.provide(NodeServerLive),
      Effect.provide(SwaggerRouter.SwaggerFilesLive),
      Effect.forkScoped,
    );

    return yield* _(
      Deferred.await(allocatedUrl),
      Effect.map((url) => Client.make(api, { baseUrl: url, ...options })),
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
