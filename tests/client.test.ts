import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

test("quickstart example e2e", async () => {
  const responseSchema = S.struct({ name: S.string });

  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: responseSchema,
      query: { id: S.NumberFromString },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("getUser", ({ query }) => Effect.succeed({ name: "milan" })),
    Http.exhaustive,
  );

  const client = (port: number) =>
    pipe(api, Http.client(new URL(`http://localhost:${port}`)));

  const user = await pipe(
    server,
    Http.setLogger("none"),
    Http.listen(),
    Effect.flatMap(({ port }) => client(port).getUser({ query: { id: 12 } })),
    Effect.runPromise,
  );

  expect(user).toEqual({ name: "milan" });
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
  const responseSchema = S.struct({ name: S.string });

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

  const client = (port: number) =>
    pipe(api, Http.client(new URL(`http://localhost:${port}`)));

  const user = await pipe(
    server,
    Http.setLogger("none"),
    Http.listen(),
    Effect.flatMap(({ port }) => client(port).doStuff({})),
    Effect.runPromise,
  );

  expect(user).toEqual({ name: "milan" });
});

test("All input types", async () => {
  const responseSchema = S.struct({
    value: S.string,
    anotherValue: S.number,
    operation: S.string,
    helloWorld: S.string,
  });
  const querySchema = {
    value: S.string,
    anotherValue: S.NumberFromString,
  };
  const paramsSchema = { operation: S.string };
  const bodySchema = S.struct({ helloWorld: S.string });

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

  const client = (port: number) =>
    pipe(api, Http.client(new URL(`http://localhost:${port}`)));

  const user = await pipe(
    server,
    Http.setLogger("none"),
    Http.listen(),
    Effect.flatMap(({ port }) =>
      client(port).doStuff({
        params: { operation: "operation" },
        query: { value: "value", anotherValue: 1 },
        body: { helloWorld: "helloWorld" },
      }),
    ),
    Effect.runPromise,
  );

  expect(user).toEqual({
    operation: "operation",
    value: "value",
    anotherValue: 1,
    helloWorld: "helloWorld",
  });
});
