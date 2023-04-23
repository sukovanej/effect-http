import * as Http from "effect-http";
import http from "http";
import { AddressInfo } from "net";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Scope from "@effect/io/Scope";

export const testServer = <R, Es extends Http.Endpoint[]>(
  server: Http.Server<R, []>,
  api: Http.Api<Es>,
): Effect.Effect<R | Scope.Scope, unknown, Http.Client<Http.Api<Es>>> =>
  pipe(
    Effect.asyncEffect<
      never,
      never,
      [Http.Client<Http.Api<Es>>, http.Server],
      R,
      unknown,
      void
    >((cb) =>
      pipe(
        server,
        Http.listen({
          logger: "none",
          onStart: (httpServer) =>
            pipe(
              api,
              Http.client(
                new URL(
                  `http://localhost:${
                    (httpServer.address() as AddressInfo).port
                  }`,
                ),
              ),
              (client) => {
                cb(Effect.succeed([client, httpServer]));
                return Effect.unit();
              },
            ),
        }),
      ),
    ),
    Effect.tap(([_, httpServer]) =>
      Effect.acquireRelease(Effect.unit(), () =>
        pipe(
          Effect.try(() => httpServer.close()),
          Effect.orDie,
        ),
      ),
    ),
    Effect.map(([client]) => client),
  );
