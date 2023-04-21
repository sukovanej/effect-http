import * as Http from "effect-http";
import { createHash } from "node:crypto";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Schema from "@effect/schema/Schema";

const Service1 = Context.Tag<number>();
const Service2 = Context.Tag<string>();

const layer1 = Layer.succeed(Service2, "hello world");
const layer2 = pipe(
  Effect.map(Service2, (value) => value.length),
  Effect.toLayer(Service1),
);

test("multiple provideLayer calls", async () => {
  const api = pipe(
    Http.api(),
    Http.get("doStuff", "/stuff", { response: Schema.number }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("doStuff", () => Effect.map(Service1, (value) => value + 2)),
    Http.provideLayer(layer2),
    Http.provideLayer(layer1),
    Http.exhaustive,
  );

  const result = await Effect.runPromise(server.handlers[0].fn({}));

  expect(result).toEqual(13);
});

test("validation error", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      query: {
        country: pipe(Schema.string, Schema.pattern(/^[A-Z]{2}$/)),
      },
      response: Schema.string,
    }),
  );

  const server = Http.exampleServer(api);

  await pipe(
    server,
    Http.setLogger("none"),
    Http.listen(),
    Effect.flatMap(({ port }) =>
      pipe(api, Http.client(new URL(`http://localhost:${port}`)), (client) =>
        client.hello({ query: { country: "abc" } }),
      ),
    ),
    Effect.map(() => {
      assert.fail("Expected failure");
    }),
    Effect.catchAll((error) => {
      expect(error).toMatchObject({
        _tag: "ClientValidationError",
        error: { _tag: "InvalidQueryError" },
      });
      return Effect.unit();
    }),
    Effect.runPromise,
  );
});

test("human-readable error response", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", { response: Schema.string }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", () =>
      Effect.fail(Http.notFoundError("Didnt find it")),
    ),
  );

  await pipe(
    server,
    Http.setLogger("none"),
    Http.listen(),
    Effect.flatMap(({ port }) =>
      pipe(api, Http.client(new URL(`http://localhost:${port}`)), (client) =>
        client.hello({}),
      ),
    ),
    Effect.map(() => {
      assert.fail("Expected failure");
    }),
    Effect.catchAll((error) => {
      expect(error).toEqual({
        _tag: "HttpClientError",
        statusCode: 404,
        error: {
          error: "NotFoundError",
          details: "Didnt find it",
        },
      });
      return Effect.unit();
    }),
    Effect.runPromise,
  );
});

test("headers", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.struct({ clientIdHash: Schema.string }),
      headers: { "X-Client-Id": Schema.string },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", ({ headers: { "x-client-id": apiKey } }) =>
      Effect.succeed({
        clientIdHash: createHash("sha256").update(apiKey).digest("base64"),
      }),
    ),
  );

  await pipe(
    server,
    Http.setLogger("none"),
    Http.listen(),
    Effect.flatMap(({ port }) =>
      pipe(api, Http.client(new URL(`http://localhost:${port}`)), (client) =>
        client.hello({ headers: { "x-client-id": "abc" } }),
      ),
    ),
    Effect.map((result) => {
      expect(result).toEqual({
        clientIdHash: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=",
      });
      return Effect.unit();
    }),
    Effect.runPromise,
  );
});
