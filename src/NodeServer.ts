import * as App from "@effect/platform/Http/App";
import * as Server from "@effect/platform/Http/Server";
import type * as ServeError from "@effect/platform/Http/ServerError";
import { pipe } from "effect";
import * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as Effect from "effect/Effect";

interface ListenOptions {
  port: number | undefined;
}

const DEFAULT_LISTEN_OPTIONS: ListenOptions = {
  port: undefined,
};

export const listen =
  (options?: Partial<ListenOptions>) =>
  <R, E>(
    router: App.Default<R, E>,
  ): Effect.Effect<
    Exclude<R, SwaggerRouter.SwaggerFiles>,
    ServeError.ServeError,
    never
  > =>
    Effect.gen(function* (_) {
      const _options = { ...DEFAULT_LISTEN_OPTIONS, ...options };

      const NodeServer = yield* _(
        Effect.promise(() => import("@effect/platform-node/Http/Server")),
      );

      const { createServer } = yield* _(Effect.promise(() => import("http")));

      const NodeServerLive = NodeServer.layer(() => createServer(), _options);

      return yield* _(
        pipe(
          Effect.gen(function* (_) {
            const server = yield* _(Server.Server);
            const address =
              server.address._tag === "UnixAddress"
                ? server.address.path
                : `${server.address.hostname}:${server.address.port}`;

            yield* _(Effect.log(`Listening on ${address}`));
          }),
          Effect.flatMap(() => Server.serve(router)),
          Effect.scoped,
          Effect.provide(NodeServerLive),
          Effect.provide(SwaggerRouter.SwaggerFilesLive),
        ),
      );
    });
