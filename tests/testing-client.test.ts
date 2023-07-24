import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

import { runTestEffect } from "./utils";

test("testing query", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.string,
      request: {
        query: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", ({ query }) => Effect.succeed(`${query.input + 1}`)),
  );

  const response = await pipe(
    Http.testingClient(server).hello({ query: { input: 12 } }),
    runTestEffect,
  );

  expect(await response.json()).toEqual("13");
});

test("testing failure", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.string,
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", () => Effect.fail(Http.notFoundError("oh oh"))),
  );

  const response = await pipe(
    Http.testingClient(server).hello({ query: { input: 12 } }),
    runTestEffect,
  );

  expect(await response.json()).toEqual({
    error: "NotFoundError",
    details: "oh oh",
  });
  expect(response.status).toEqual(404);
});

test("testing with dependencies", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.string,
      request: {
        query: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const MyService = Context.Tag<number>();

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", ({ query }) =>
      Effect.map(MyService, (v) => `${query.input + v}`),
    ),
  );

  const response = await pipe(
    Http.testingClient(server).hello({ query: { input: 12 } }),
    Effect.provideService(MyService, 2),
    runTestEffect,
  );

  expect(await response.json()).toEqual("14");
});

test("testing params", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello/:input", {
      response: Schema.string,
      request: {
        params: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", ({ params }) => Effect.succeed(`${params.input + 1}`)),
  );

  const response = await pipe(
    Http.testingClient(server).hello({ params: { input: 12 } }),
    runTestEffect,
  );

  expect(await response.json()).toEqual("13");
});
