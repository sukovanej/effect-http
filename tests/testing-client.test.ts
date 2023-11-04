import { Schema } from "@effect/schema";
import { Context, Effect, Either, Predicate, pipe } from "effect";
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
      Http.HttpClientError.create(
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

test("form data", async () => {
  const api = pipe(
    Http.api(),
    Http.post("upload", "/upload", {
      request: {
        body: Http.FormData,
      },
      response: Schema.string,
    }),
  );

  const server = pipe(
    Http.server(api),
    Http.handle("upload", ({ body }) => {
      const file = body.get("file");

      if (file === null) {
        return Effect.fail(Http.invalidBodyError('Expected "file"'));
      }

      if (Predicate.isString(file)) {
        return Effect.fail(Http.invalidBodyError("Expected file"));
      }

      return Effect.promise(() => file.text());
    }),
  );

  const testClient = Http.testingClient(server);

  const formData = new FormData();
  formData.append("file", new Blob(["my file content"]));

  const response = await pipe(
    testClient.upload({ body: formData }),
    runTestEffect,
  );

  expect(response).toEqual("my file content");
});
