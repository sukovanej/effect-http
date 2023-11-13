import { createServer } from "http";

import * as PlatformNodeServer from "@effect/platform-node/Http/Server";
import * as PlatformClient from "@effect/platform/Http/Client";
import { HttpClientError } from "@effect/platform/Http/ClientError";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as ClientResponse from "@effect/platform/Http/ClientResponse";
import * as Middleware from "@effect/platform/Http/Middleware";
import * as Router from "@effect/platform/Http/Router";
import * as Server from "@effect/platform/Http/Server";
import { Effect, Layer, LogLevel, Logger, Scope, Unify, pipe } from "effect";
import { apply } from "effect/Function";

const logger = Logger.none;

export const runTestEffect = <E, A>(self: Effect.Effect<Scope.Scope, E, A>) =>
  pipe(
    self,
    Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
    Logger.withMinimumLogLevel(LogLevel.All),
    Effect.scoped,
    Effect.runPromise,
  );

const serverUrl = Effect.map(Server.Server, (server) => {
  const address = server.address;

  if (address._tag === "UnixAddress") {
    return address.path;
  }

  return `http://localhost:${address.port}`;
});

const client = Effect.gen(function* (_) {
  const defaultClient = yield* _(PlatformClient.Client);
  const url = yield* _(serverUrl);

  return defaultClient.pipe(
    PlatformClient.mapRequest(ClientRequest.prependUrl(url.toString())),
  );
});

export const testRouter: {
  <R, E>(
    router: Router.Router<R, E>,
    request: ClientRequest.ClientRequest,
  ): Effect.Effect<R, HttpClientError, ClientResponse.ClientResponse>;
  <R, E>(
    router: Router.Router<R, E>,
    request: readonly ClientRequest.ClientRequest[],
  ): Effect.Effect<
    R,
    HttpClientError,
    readonly ClientResponse.ClientResponse[]
  >;
} = <R, E>(
  router: Router.Router<R, E>,
  request: ClientRequest.ClientRequest | readonly ClientRequest.ClientRequest[],
) => {
  const ServerLive = pipe(
    PlatformNodeServer.layer(() => createServer(), {
      port: undefined,
    }),
    Layer.merge(PlatformClient.layer),
  );

  const serve = Server.serve(router.pipe(Middleware.logger)).pipe(
    Effect.scoped,
  );
  const runTest = Unify.unify(
    Array.isArray(request)
      ? Effect.flatMap(client, (client) =>
          Effect.forEach(
            request as readonly ClientRequest.ClientRequest[],
            (r) => client(r),
          ),
        )
      : Effect.flatMap(client, apply(request as ClientRequest.ClientRequest)),
  );

  return serve.pipe(
    Effect.tapErrorCause(Effect.logError),
    Effect.scoped,
    Effect.forkScoped,
    Effect.flatMap((fiber) =>
      Effect.acquireRelease(
        runTest.pipe(Effect.tapErrorCause(Effect.logError)),
        () => Effect.interruptWith(fiber.id()).pipe(Effect.ignoreLogged),
      ),
    ),
    Effect.map((response) => response as any),
    Effect.provide(ServerLive),
    Effect.scoped,
  );
};
