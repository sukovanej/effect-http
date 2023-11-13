import { vi } from "vitest";

import { Schema } from "@effect/schema";
import { Cause, Duration, Effect, Either, Exit, Fiber, pipe } from "effect";
import { Api, ExampleServer, RouterBuilder } from "effect-http";

import { exampleApiGetQueryParameter } from "./examples";
import { runTestEffect, testApp } from "./utils";

test("quickstart example e2e", async () => {
  const api = pipe(
    Api.api(),
    Api.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        query: Schema.struct({ id: Schema.NumberFromString }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("getUser", ({ query }) =>
      Effect.succeed({ name: `milan:${query.id}` }),
    ),
    RouterBuilder.build,
  );

  await pipe(
    app,
    testApp(api),
    Effect.flatMap((client) => client.getUser({ query: { id: 12 } })),
    Effect.map((response) => {
      expect(response).toEqual({ name: "milan:12" });
    }),
    runTestEffect,
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
    Api.api(),
    Api[method]("doStuff", "/stuff", {
      response: responseSchema,
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("doStuff", () => Effect.succeed({ name: "milan" })),
    RouterBuilder.build,
  );

  await pipe(
    app,
    testApp(api),
    Effect.flatMap((client) => client.doStuff({})),
    Effect.map((response) => {
      expect(response).toEqual({ name: "milan" });
    }),
    runTestEffect,
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
    Api.api(),
    Api.post("doStuff", "/stuff/:operation", {
      response: responseSchema,
      request: {
        body: bodySchema,
        query: querySchema,
        params: paramsSchema,
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("doStuff", ({ body, query, params }) =>
      Effect.succeed({ ...body, ...query, ...params }),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(api),
    Effect.flatMap((client) =>
      client.doStuff({
        params: { operation: "operation" },
        query: { value: "value", anotherValue: 1 },
        body: { helloWorld: "helloWorld" },
      }),
    ),
    runTestEffect,
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
    Api.api(),
    Api.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        headers: Schema.struct({
          "X-MY-HEADER": Schema.NumberFromString,
          "Another-Header": Schema.string,
        }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("getUser", ({ headers: { "x-my-header": header } }) =>
      Effect.succeed({ name: `patrik ${header}` }),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(api),
    // @ts-expect-error
    Effect.flatMap((client) => Effect.either(client.getUser())),
    runTestEffect,
  );

  expect(result).toMatchObject(
    Either.left({ _tag: "RequestEncodeError", location: "headers" }),
  );
});

test("common headers", async () => {
  const api = pipe(
    Api.api(),
    Api.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        headers: Schema.struct({ "X-MY-HEADER": Schema.NumberFromString }),
      },
    }),
    Api.post("doSomething", "/something", {
      response: Schema.struct({ name: Schema.string }),
      request: {
        headers: Schema.struct({
          "X-MY-HEADER": Schema.NumberFromString,
          "ANOTHER-HEADER": Schema.string,
        }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("getUser", ({ headers: { "x-my-header": header } }) =>
      Effect.succeed({ name: `patrik ${header}` }),
    ),
    RouterBuilder.handle(
      "doSomething",
      ({ headers: { "x-my-header": header, "another-header": another } }) =>
        Effect.succeed({ name: `matej ${header} ${another}` }),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(api),
    // TODO
    //Effect.flatMap((client) =>
    //  Effect.all([
    //    client.getUser({ headers: { "x-my-header": 2 } }),
    //    client.getUser({ headers: {} }),
    //    client.getUser(),
    //    client.doSomething({
    //      headers: { "x-my-header": 2, "another-header": "another" },
    //    }),
    //    client.doSomething({
    //      headers: { "another-header": "another" },
    //    }),
    //    client.doSomething(),
    //  ]),
    //),
    runTestEffect,
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
    Api.api(),
    Api.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
    }),
  );

  const generateName = vi.fn(() => ({ name: `test` }));

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("getUser", () =>
      Effect.delay(Effect.sync(generateName), Duration.seconds(1)),
    ),
    RouterBuilder.build,
  );

  await pipe(
    app,
    testApp(api),
    Effect.flatMap((client) =>
      Effect.gen(function* ($) {
        const request = yield* $(Effect.fork(client.getUser()));
        const result = yield $(Fiber.interrupt(request));

        expect(Exit.isFailure(result)).toEqual(true);
        expect(Cause.isInterruptedOnly(result.i0)).toEqual(true);
        expect(generateName).not.toHaveBeenCalled();
      }),
    ),
    runTestEffect,
  );
});

test("validation error", async () => {
  const app = ExampleServer.make(exampleApiGetQueryParameter);

  const result = await pipe(
    RouterBuilder.build(app),
    testApp(exampleApiGetQueryParameter),
    Effect.flatMap((client) =>
      Effect.either(client.hello({ query: { country: "abc" } })),
    ),
    runTestEffect,
  );

  expect(result).toMatchObject(
    Either.left({ _tag: "RequestEncodeError", location: "query" }),
  );
});
