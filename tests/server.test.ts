import * as Http from "effect-http";
import { createHash } from "node:crypto";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Schema from "@effect/schema/Schema";

import { testServer } from "./utils";

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

  const layer = Layer.provide(layer1, layer2);

  const server = pipe(
    api,
    Http.server,
    Http.handle("doStuff", () => Effect.map(Service1, (value) => value + 2)),
    Http.exhaustive,
  );

  await pipe(
    testServer(server, api),
    Effect.provideSomeLayer(layer),
    Effect.flatMap((client) => client.doStuff({})),
    Effect.map((response) => {
      expect(response).toEqual(13);
    }),
    Effect.scoped,
    Effect.runPromise,
  );
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
    testServer(server, api),
    Effect.flatMap((client) => client.hello({ query: { country: "abc" } })),
    Effect.map(() => {
      assert.fail("Expected failure");
    }),
    Effect.catchAll((error) => {
      expect(error).toMatchObject({
        _tag: "ValidationClientError",
        error: { _tag: "InvalidQueryError" },
      });
      return Effect.unit();
    }),
    Effect.scoped,
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
    testServer(server, api),
    Effect.flatMap((client) => client.hello({})),
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
    Effect.scoped,
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
    Http.exhaustive,
  );

  await pipe(
    testServer(server, api),
    Effect.flatMap((client) =>
      client.hello({ headers: { "x-client-id": "abc" } }),
    ),
    Effect.map((result) => {
      expect(result).toEqual({
        clientIdHash: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=",
      });
      return Effect.unit();
    }),
    Effect.scoped,
    Effect.runPromise,
  );
});

test.each(Http.API_ERROR_TAGS as Http.ApiError["_tag"][])(
  "status codes",
  async (errorTag) => {
    const api = pipe(
      Http.api(),
      Http.get("hello", "/hello", {
        response: Schema.struct({ clientIdHash: Schema.string }),
      }),
    );

    const server = pipe(
      Http.server(api),
      Http.handle("hello", () =>
        Effect.fail({ _tag: errorTag, error: "failure" }),
      ),
    );

    await pipe(
      testServer(server, api),
      Effect.flatMap((client) => client.hello({})),
      Effect.catchAll((error) => {
        expect(error).toMatchObject({
          statusCode: Http.API_STATUS_CODES[errorTag],
        });
        return Effect.unit();
      }),
      Effect.scoped,
      Effect.runPromise,
    );
  },
);

test("Attempt to add a non-existing operation should fail as a safe guard", () => {
  const api = pipe(
    Http.api(),
    Http.put("myOperation", "/my-operation", { response: Schema.string }),
  );

  expect(() =>
    pipe(
      Http.server(api),
      Http.handle("nonExistingOperation" as any, () => "" as any),
    ),
  ).toThrowError();
});

test("Response object", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.struct({ value: Schema.string }),
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", () =>
      Effect.succeed(
        pipe(Http.toResponse({ value: "test" }), Http.setStatusCode(201)),
      ),
    ),
    Http.exhaustive,
  );

  await pipe(
    testServer(server, api),
    Effect.flatMap((client) =>
      client.hello({ headers: { "x-client-id": "abc" } }),
    ),
    Effect.map((result) => {
      expect(result).toEqual({
        value: "test",
      });
      return Effect.unit();
    }),
    Effect.scoped,
    Effect.runPromise,
  );
});
