import express from "express";
import { createServer } from "http";
import http from "http";
import { AddressInfo, Socket } from "net";

import * as Server from "@effect/platform-node/Http/Server";
import * as Client from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as ClientResponse from "@effect/platform/Http/ClientResponse";
import * as Middleware from "@effect/platform/Http/Middleware";
import * as HttpServer from "@effect/platform/HttpServer";
import { Effect, Layer, Logger, Scope, Unify, pipe } from "effect";
import * as Http from "effect-http";
import { apply } from "effect/Function";

const testServerUrl = <R, A extends Http.Api>(
  serverBuilder: Http.ServerBuilder<R, never, A>,
): Effect.Effect<R | Scope.Scope, unknown, URL> =>
  pipe(
    Effect.asyncEffect<
      never,
      never,
      [URL, http.Server, Socket[]],
      R,
      unknown,
      void
    >((cb) =>
      pipe(
        serverBuilder,
        Http.listen({
          onStart: (httpServer) => {
            const url = new URL(
              `http://localhost:${(httpServer.address() as AddressInfo).port}`,
            );
            const sockets: Socket[] = [];
            httpServer.on("connection", (s) => sockets.push(s));
            cb(Effect.succeed([url, httpServer, sockets]));
            return Effect.unit;
          },
        }),
      ),
    ),
    Effect.tap(([_, httpServer, sockets]) =>
      Effect.acquireRelease(Effect.unit, () =>
        pipe(
          Effect.try(() => {
            sockets.forEach((s) => {
              if (!s.closed) {
                s.destroy();
              }
            });
            httpServer.close();
          }),
          Effect.orDie,
        ),
      ),
    ),
    Effect.map(([url]) => url),
  );

export const testServer = <
  R,
  A extends Http.Api,
  H extends Record<string, unknown> = Record<never, never>,
>(
  serverBuilder: Http.ServerBuilder<R, never, A>,
  clientOptions?: Parameters<typeof Http.client<A, H>>[2],
) =>
  pipe(
    testServerUrl(serverBuilder),
    Effect.map((url) => Http.client(serverBuilder.api, url, clientOptions)),
  );

export const testExpress =
  <Endpoints extends Http.Endpoint>(api: Http.Api<Endpoints>) =>
  (
    server: express.Express,
  ): Effect.Effect<
    Scope.Scope,
    unknown,
    [Http.Client<Endpoints, Record<string, never>>, http.Server]
  > =>
    pipe(
      Effect.asyncEffect<
        never,
        never,
        [Http.Client<Endpoints, Record<string, never>>, http.Server, Socket[]],
        never,
        unknown,
        void
      >((cb) =>
        pipe(
          server,
          Http.listenExpress({
            onStart: (httpServer) => {
              const port = (httpServer.address() as AddressInfo).port;
              const url = new URL(`http://localhost:${port}`);
              const client = Http.client(api, url);
              const sockets: Socket[] = [];
              httpServer.on("connection", (s) => sockets.push(s));
              cb(Effect.succeed([client, httpServer, sockets]));
              return Effect.unit;
            },
          }),
        ),
      ),
      Effect.tap(([_, httpServer, sockets]) =>
        Effect.acquireRelease(Effect.unit, () =>
          pipe(
            Effect.try(() => {
              sockets.forEach((s) => {
                if (!s.closed) {
                  s.destroy();
                }
              });
              httpServer.close();
            }),
            Effect.orDie,
          ),
        ),
      ),
      Effect.map(([client, httpServer]) => [client, httpServer]),
    );

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
  const defaultClient = yield* _(Client.Client);
  const url = yield* _(serverUrl);

  return defaultClient.pipe(
    Client.mapRequest(ClientRequest.prependUrl(url.toString())),
  );
});

export const testRouter: {
  <E1>(
    router: HttpServer.router.Router<never, E1>,
    request: ClientRequest.ClientRequest,
  ): Effect.Effect<never, never, ClientResponse.ClientResponse>;
  <E1>(
    router: HttpServer.router.Router<never, E1>,
    request: readonly ClientRequest.ClientRequest[],
  ): Effect.Effect<never, never, readonly ClientResponse.ClientResponse[]>;
} = <E1>(
  router: HttpServer.router.Router<never, E1>,
  request: ClientRequest.ClientRequest | readonly ClientRequest.ClientRequest[],
) => {
  const ServerLive = pipe(
    Server.layer(() => createServer(), {
      port: undefined,
    }),
    Layer.merge(Client.layer),
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
