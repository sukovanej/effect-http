import { vi } from "vitest";

import * as Duration from "@effect/data/Duration";
import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as Cause from "@effect/io/Cause";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Fiber from "@effect/io/Fiber";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

import { testServer } from "./utils";

test("quickstart example e2e", async () => {
  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        query: Schema.struct({ id: Schema.NumberFromString }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("getUser", ({ query }) =>
      Effect.succeed({ name: `milan:${query.id}` }),
    ),
    Http.exhaustive,
  );

  await pipe(
    testServer(server),
    Effect.flatMap((client) => client.getUser({ query: { id: 12 } })),
    Effect.map((response) => {
      expect(response).toEqual({ name: "milan:12" });
    }),
    Effect.scoped,
    Effect.runPromise,
  );
});

const methods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "patch",
  // "head",
  // "trace",
] as const;

test.each(methods)("Dummy call - %s", async (method) => {
  const responseSchema = Schema.struct({ name: Schema.string });

  const api = pipe(
    Http.api(),
    Http[method]("doStuff", "/stuff", {
      response: responseSchema,
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("doStuff", () => Effect.succeed({ name: "milan" })),
    Http.exhaustive,
  );

  await pipe(
    testServer(server),
    Effect.flatMap((client) => client.doStuff({})),
    Effect.map((response) => {
      expect(response).toEqual({ name: "milan" });
    }),
    Effect.scoped,
    Effect.runPromise,
  );
});

test("All input types", async () => {
  const responseSchema = Schema.struct({
    value: Schema.string,
    anotherValue: Schema.number,
    operation: Schema.string,
    helloWorld: Schema.string,
  });
  const querySchema = Schema.struct({
    value: Schema.string,
    anotherValue: Schema.NumberFromString,
  });
  const paramsSchema = Schema.struct({ operation: Schema.string });
  const bodySchema = Schema.struct({ helloWorld: Schema.string });

  const api = pipe(
    Http.api(),
    Http.post("doStuff", "/stuff/:operation", {
      response: responseSchema,
      request: {
        body: bodySchema,
        query: querySchema,
        params: paramsSchema,
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("doStuff", ({ body, query, params }) =>
      Effect.succeed({ ...body, ...query, ...params }),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      client.doStuff({
        params: { operation: "operation" },
        query: { value: "value", anotherValue: 1 },
        body: { helloWorld: "helloWorld" },
      }),
    ),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual({
    operation: "operation",
    value: "value",
    anotherValue: 1,
    helloWorld: "helloWorld",
  });
});

test("missing headers", async () => {
  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        headers: Schema.struct({
          "X-MY-HEADER": Schema.NumberFromString,
          "Another-Header": Schema.string,
        }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("getUser", ({ headers: { "x-my-header": header } }) =>
      Effect.succeed({ name: `patrik ${header}` }),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server, { headers: { "another-header": "str" } }),
    // @ts-expect-error
    Effect.flatMap((client) => Effect.either(client.getUser())),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toMatchObject(
    Either.left(Http.validationClientError({ _tag: "InvalidHeadersError" })),
  );
});

test("common headers", async () => {
  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        headers: Schema.struct({ "X-MY-HEADER": Schema.NumberFromString }),
      },
    }),
    Http.post("doSomething", "/something", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        headers: Schema.struct({
          "X-MY-HEADER": Schema.NumberFromString,
          "ANOTHER-HEADER": Schema.string,
        }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("getUser", ({ headers: { "x-my-header": header } }) =>
      Effect.succeed({ name: `patrik ${header}` }),
    ),
    Http.handle(
      "doSomething",
      ({ headers: { "x-my-header": header, "another-header": another } }) =>
        Effect.succeed({ name: `matej ${header} ${another}` }),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server, {
      headers: { "x-my-header": 1, "another-header": "test" },
    }),
    Effect.flatMap((client) =>
      Effect.all([
        client.getUser({ headers: { "x-my-header": 2 } }),
        client.getUser({ headers: {} }),
        client.getUser(),
        client.doSomething({
          headers: { "x-my-header": 2, "another-header": "another" },
        }),
        client.doSomething({
          headers: { "another-header": "another" },
        }),
        client.doSomething(),
      ]),
    ),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual([
    { name: "patrik 2" },
    { name: "patrik 1" },
    { name: "patrik 1" },
    { name: "matej 2 another" },
    { name: "matej 1 another" },
    { name: "matej 1 test" },
  ]);
});

test("supports interruption", async () => {
  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
    }),
  );

  const generateName = vi.fn(() => ({ name: `test` }));

  const server = pipe(
    api,
    Http.server,
    Http.handle("getUser", () =>
      Effect.delay(Effect.sync(generateName), Duration.seconds(1)),
    ),
    Http.exhaustive,
  );

  await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.gen(function* ($) {
        const request = yield* $(Effect.fork(client.getUser()));
        const result = yield $(Fiber.interrupt(request));

        expect(Exit.isFailure(result)).toEqual(true);
        expect(Cause.isInterruptedOnly(result.i0)).toEqual(true);
        expect(generateName).not.toHaveBeenCalled();
      }),
    ),
    Effect.scoped,
    Effect.runPromise,
  );
});
