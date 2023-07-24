import { AddressInfo } from "net";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

import * as Http from "effect-http";

import { runTestEffect, testExpress } from "./utils";

test("/docs endpoint", async () => {
  const api = Http.api();

  const response = await pipe(
    Http.server(api),
    Http.express(),
    Effect.flatMap(testExpress(api)),
    Effect.flatMap(([_, server]) =>
      Effect.tryPromise(() => {
        const port = (server.address() as AddressInfo).port;
        const url = new URL(`http://localhost:${port}/docs`);
        return fetch(url);
      }),
    ),
    runTestEffect,
  );

  expect(response.headers.get("content-type")).toEqual(
    "text/html; charset=utf-8",
  );
});
