import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import { testServer } from "./utils";

test("quickstart example e2e", async () => {
  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: Schema.struct({ name: Schema.string }),
      query: { id: Schema.NumberFromString },
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
    testServer(server, api),
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
    testServer(server, api),
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
  const querySchema = {
    value: Schema.string,
    anotherValue: Schema.NumberFromString,
  };
  const paramsSchema = { operation: Schema.string };
  const bodySchema = Schema.struct({ helloWorld: Schema.string });

  const api = pipe(
    Http.api(),
    Http.post("doStuff", "/stuff/:operation", {
      response: responseSchema,
      body: bodySchema,
      query: querySchema,
      params: paramsSchema,
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

  await pipe(
    testServer(server, api),
    Effect.flatMap((client) =>
      client.doStuff({
        params: { operation: "operation" },
        query: { value: "value", anotherValue: 1 },
        body: { helloWorld: "helloWorld" },
      }),
    ),
    Effect.map((response) => {
      expect(response).toEqual({
        operation: "operation",
        value: "value",
        anotherValue: 1,
        helloWorld: "helloWorld",
      });
    }),
    Effect.scoped,
    Effect.runPromise,
  );
});
