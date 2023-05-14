import * as Http from "effect-http";
import express from "express";
import http, { Server } from "http";
import { AddressInfo, Socket } from "net";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Scope from "@effect/io/Scope";

export const testServerUrl = <R>(
  server: Http.Server<R, []>,
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
            return Effect.unit();
          },
        }),
      ),
    ),
    Effect.tap(([_, httpServer, sockets]) =>
      Effect.acquireRelease(Effect.unit(), () =>
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

export const testServer = <R, Es extends Http.Endpoint[]>(
  server: Http.Server<R, []>,
  api: Http.Api<Es>,
): Effect.Effect<
  R | Scope.Scope,
  unknown,
  Http.Client<Http.Api<Es>, Record<string, never>>
> =>
  pipe(
    testServerUrl(server),
    Effect.map((url) => pipe(api, Http.client(url))),
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
              return Effect.unit();
            },
          }),
        ),
      ),
      Effect.tap(([_, httpServer, sockets]) =>
        Effect.acquireRelease(Effect.unit(), () =>
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
