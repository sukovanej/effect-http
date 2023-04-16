import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

test("quickstart example e2e", async () => {
  const responseSchema = S.struct({ name: S.string });
  const querySchema = S.struct({ id: S.NumberFromString });

  const api = pipe(
    Http.api(),
    Http.get("getUser", "/user", {
      response: responseSchema,
      query: querySchema,
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
