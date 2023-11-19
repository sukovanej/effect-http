/**
 * Simplified way to run a server.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App";
import * as Server from "@effect/platform/Http/Server";
import * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as Effect from "effect/Effect";

const serverAddress = Effect.gen(function* (_) {
  const server = yield* _(Server.Server);

  if (server.address._tag === "UnixAddress") {
    return server.address.path;
  }

  return `${server.address.hostname}:${server.address.port}`;
});

/**
 * @category combinators
 * @since 1.0.0
 */
export const serve = <R, E>(router: App.Default<R, E>) =>
  serverAddress.pipe(
    Effect.flatMap((address) => Effect.log(`Listening on ${address}`)),
    Effect.flatMap(() => Server.serve(router)),
    Effect.scoped,
    Effect.provide(SwaggerRouter.SwaggerFilesLive),
  );
