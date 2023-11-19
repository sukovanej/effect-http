import type * as App from "@effect/platform/Http/App";
import type * as NodeServer from "effect-http/NodeServer";
import * as server from "effect-http/internal/server";
import * as Effect from "effect/Effect";

const DEFAULT_LISTEN_OPTIONS: NodeServer.Options = {
  port: undefined,
};

export const listen =
  (options?: Partial<NodeServer.Options>) =>
  <R, E>(app: App.Default<R, E>) =>
    Effect.gen(function* (_) {
      const _options = { ...DEFAULT_LISTEN_OPTIONS, ...options };

      const NodeServer = yield* _(
        Effect.promise(() => import("@effect/platform-node/Http/Server")),
      );

      const NodeContext = yield* _(
        Effect.promise(() => import("@effect/platform-node/NodeContext")),
      );

      const { createServer } = yield* _(Effect.promise(() => import("http")));

      const NodeServerLive = NodeServer.layer(() => createServer(), _options);

      return yield* _(
        server.serve(app),
        Effect.provide(NodeServerLive),
        Effect.provide(NodeContext.layer),
      );
    });
