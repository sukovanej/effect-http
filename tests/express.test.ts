import { AddressInfo } from "net";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

import * as Http from "effect-http";

import { testExpress } from "./utils";

test("/docs endpoint", async () => {
  const api = Http.api();

  await pipe(
    Http.server(api),
    Http.express(),
    Effect.flatMap(testExpress(api)),
    Effect.tap(([_, server]) =>
      pipe(
        Effect.tryPromise(() => {
          const port = (server.address() as AddressInfo).port;
          const url = new URL(`http://localhost:${port}/docs`);
          return fetch(url);
        }),
        Effect.map((response) =>
          expect(response.headers.get("content-type")).toEqual(
            "text/html; charset=utf-8",
          ),
        ),
      ),
    ),
    Effect.scoped,
    Effect.runPromise,
  );
});
