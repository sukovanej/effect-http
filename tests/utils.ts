import express from "express";
import http, { Server } from "http";
import { AddressInfo, Socket } from "net";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Scope from "@effect/io/Scope";

import * as Http from "effect-http";

export const testServerUrl = <R, A extends Http.Api>(
  server: Http.Server<R, [], A>,
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
        server,
        Http.listen({
          logger: "none",
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
    Effect.map(([client]) => client),
  );

export const testServer = <
  R,
  A extends Http.Api,
  H extends Record<string, unknown> = Record<never, never>,
>(
  server: Http.Server<R, [], A>,
  clientOptions?: Parameters<typeof Http.client<A, H>>[1],
) =>
  pipe(
    testServerUrl(server),
    Effect.map((url) => pipe(server.api, Http.client(url, clientOptions))),
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
            logger: "none",
            onStart: (httpServer) => {
              const port = (httpServer.address() as AddressInfo).port;
              const url = new URL(`http://localhost:${port}`);
              const client = pipe(api, Http.client(url));
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
