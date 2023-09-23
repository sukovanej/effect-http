import express from "express";
import http, { Server } from "http";
import { AddressInfo, Socket } from "net";

import { Effect, Logger, Scope, pipe } from "effect";
import * as Http from "effect-http";

const testServerUrl = <R, A extends Http.Api>(
  serverBuilder: Http.ServerBuilder<R, [], A>,
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
  serverBuilder: Http.ServerBuilder<R, [], A>,
  clientOptions?: Parameters<typeof Http.client<A, H>>[2],
) =>
  pipe(
    testServerUrl(serverBuilder),
    Effect.map((url) => Http.client(serverBuilder.api, url, clientOptions)),
  );

export const testExpress =
  <Es extends Http.Endpoint[]>(api: Http.Api<Es>) =>
  (
    server: express.Express,
  ): Effect.Effect<
    Scope.Scope,
    unknown,
    [Http.Client<Http.Api<Es>, Record<string, never>>, Server]
  > =>
    pipe(
      Effect.asyncEffect<
        never,
        never,
        [
          Http.Client<Http.Api<Es>, Record<string, never>>,
          http.Server,
          Socket[],
        ],
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
