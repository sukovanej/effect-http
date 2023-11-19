import { vi } from "vitest";

import { Schema } from "@effect/schema";
import { Cause, Duration, Effect, Exit, Fiber, pipe } from "effect";
import {
  Api,
  ClientError,
  ExampleServer,
  NodeTesting,
  RouterBuilder,
} from "effect-http";

import { exampleApiGetQueryParameter } from "./examples";
import { runTestEffect } from "./utils";

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
    NodeTesting.make(app, api),
    Effect.flatMap((client) => client.getUser({ query: { id: 12 } })),
    Effect.map((response) => {
      expect(response).toEqual({ name: "milan:12" });
    }),
    runTestEffect,
  );
});

test.each(["get", "put", "post", "delete", "options", "patch"] as const)(
  "Dummy call - %s",
  async (method) => {
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

    const response = await pipe(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.doStuff({})),
      runTestEffect,
    );

    expect(response).toEqual({ name: "milan" });
  },
);

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
    NodeTesting.make(app, api),
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
    NodeTesting.make(app, api),
    // @ts-expect-error
    Effect.flatMap((client) => client.getUser()),
    Effect.flip,
    runTestEffect,
  );

  expect(result).toEqual(
    ClientError.makeServerSide(
      {},
      400,
      "Failed to encode headers. must be a generic object, received undefined",
    ),
  );
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
    NodeTesting.make(app, api),
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
  const app = ExampleServer.make(exampleApiGetQueryParameter).pipe(
    RouterBuilder.build,
  );

  const result = await pipe(
    NodeTesting.make(app, exampleApiGetQueryParameter),
    Effect.flatMap((client) => client.hello({ query: { country: "abc" } })),
    Effect.flip,
    runTestEffect,
  );

  expect(result).toEqual(
    ClientError.makeServerSide(
      {},
      400,
      'Failed to encode query parameters. country must be a string matching the pattern ^[A-Z]{2}$, received "abc"',
    ),
  );
});
