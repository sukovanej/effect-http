import * as Context from "@effect/data/Context";
import * as Either from "@effect/data/Either";
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

  expect(response).toEqual("13");
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
    Effect.either,
    runTestEffect,
  );

  expect(response).toEqual(
    Either.left(
      Http.httpClientError(
        {
          error: "NotFoundError",
          details: "oh oh",
        },
        404,
      ),
    ),
  );
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

  expect(response).toEqual("14");
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

  expect(response).toEqual("13");
});

test("testing body", async () => {
    const api = pipe(
        Http.api(),
        Http.post("hello", "/hello", {
            response: Schema.string,
            request: {
                body: Schema.struct({ input: Schema.NumberFromString }),
            },
        }),
    );

    const server = pipe(
        api,
        Http.server,
        Http.handle("hello", ({ body }) => Effect.succeed(`${body.input + 1}`)),
    );

    const response = await pipe(
        Http.testingClient(server).hello({ body: { input: 12 } }),
        runTestEffect,
    );

    expect(response).toEqual("13");
});

test("testing multiple responses", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: [
        {
          content: Schema.number,
          status: 200,
        },
        {
          status: 201,
        },
      ],
      request: {
        query: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", ({ query, ResponseUtil }) =>
      Effect.succeed(
        query.input === 1
          ? ResponseUtil.response200({ content: 69 })
          : ResponseUtil.response201({}),
      ),
    ),
  );

  const client = Http.testingClient(server);

  const [response1, response2] = await pipe(
    Effect.all([
      client.hello({ query: { input: 1 } }),
      client.hello({ query: { input: 2 } }),
    ] as const),
    runTestEffect,
  );

  expect(response1).toMatchObject({ content: 69, status: 200 });
  expect(response2).toMatchObject({ status: 201 });
});
