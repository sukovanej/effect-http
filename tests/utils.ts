import { createServer } from "http";

import * as PlatformNodeServer from "@effect/platform-node/Http/Server";
import * as App from "@effect/platform/Http/App";
import * as PlatformClient from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as ClientResponse from "@effect/platform/Http/ClientResponse";
import * as Middleware from "@effect/platform/Http/Middleware";
import * as Router from "@effect/platform/Http/Router";
import * as Server from "@effect/platform/Http/Server";
import { Effect, Layer, Logger, Scope, Unify, pipe } from "effect";
import { Api, Client } from "effect-http";
import { apply } from "effect/Function";

const logger = Logger.none;

export const runTestEffect = <E, A>(self: Effect.Effect<Scope.Scope, E, A>) =>
  pipe(
    self,
    Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
    Effect.scoped,
    Effect.runPromise,
  );

export const runTestEffectEither = <E, A>(
  self: Effect.Effect<Scope.Scope, E, A>,
) =>
  pipe(
    self,
    Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
    Effect.scoped,
    Effect.either,
    Effect.runPromise,
  );

const serverUrl = Effect.flatMap(Server.Server, (server) => {
  const address = server.address;

  if (address._tag === "UnixAddress") {
    return Effect.die("Unexpected UnixAddress");
  }

  return Effect.succeed(new URL(`http://localhost:${address.port}`));
});

const client = Effect.gen(function* (_) {
  const defaultClient = yield* _(PlatformClient.Client);
  const url = yield* _(serverUrl);

  return defaultClient.pipe(
    PlatformClient.mapRequest(ClientRequest.prependUrl(url.toString())),
  );
});

export const testRouter: {
  <E1>(
    router: Router.Router<never, E1>,
    request: ClientRequest.ClientRequest,
  ): Effect.Effect<never, never, ClientResponse.ClientResponse>;
  <E1>(
    router: Router.Router<never, E1>,
    request: readonly ClientRequest.ClientRequest[],
  ): Effect.Effect<never, never, readonly ClientResponse.ClientResponse[]>;
} = <E1>(
  router: Router.Router<never, E1>,
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
    Effect.fork,
    Effect.flatMap((fiber) =>
      Effect.acquireRelease(
        runTest.pipe(Effect.tapErrorCause(Effect.logError)),
        () => Effect.interruptWith(fiber.id()).pipe(Effect.ignoreLogged),
      ),
    ),
    Effect.provide(ServerLive),
    Effect.scoped,
  ) as any;
};

const NodeServerLive = PlatformNodeServer.layer(() => createServer(), {
  port: undefined,
});

export const testApp =
  <Endpoints extends Api.Endpoint>(api: Api.Api<Endpoints>) =>
  <R, E>(
    app: App.Default<R, E>,
  ): Effect.Effect<Scope.Scope, never, Client.Client<Endpoints>> =>
    Effect.gen(function* (_) {
      const serverFiber = yield* _(app, Server.serve, Effect.fork);
      const url = yield* _(serverUrl);

      const client = Client.client(api, url);

      return yield* _(
        Effect.addFinalizer(() => Effect.interruptWith(serverFiber.id())),
        Effect.as(client),
      );
    }).pipe(Effect.provide(NodeServerLive), (x) => x);
