import type * as App from "@effect/platform/Http/App";
import type * as Api from "effect-http/Api";
import type * as Client from "effect-http/Client";
import type * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as testing from "effect-http/internal/testing";
import * as Effect from "effect/Effect";

export const make = <R, E, Endpoints extends Api.Endpoint>(
  app: App.Default<R, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>,
) =>
  Effect.gen(function* (_) {
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

    return yield* _(
      testing.make(app, api, options),
      Effect.provide(NodeServerLive),
      Effect.provide(NodeContext.layer),
    );
  });

export const makeRaw = <R, E>(
  app: App.Default<R | SwaggerRouter.SwaggerFiles, E>,
) =>
  Effect.gen(function* (_) {
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

    return yield* _(
      testing.makeRaw(app),
      Effect.provide(NodeServerLive),
      Effect.provide(NodeContext.layer),
    );
  });
