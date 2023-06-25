import express from "express";
import { createHash } from "node:crypto";

import * as Context from "@effect/data/Context";
import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

import { testExpress, testServer } from "./utils";

const Service1 = Context.Tag<number>();
const Service2 = Context.Tag<string>();

const layer1 = Layer.succeed(Service2, "hello world");
const layer2 = pipe(
  Effect.map(Service2, (value) => value.length),
  Layer.effect(Service1),
);

test("layers", async () => {
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

  const response = await pipe(
    testServer(server),
    Effect.provideSomeLayer(layer),
    Effect.flatMap((client) => client.doStuff({})),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(response).toEqual(13);
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

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.either(client.hello({ query: { country: "abc" } })),
    ),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toMatchObject(
    Either.left({
      _tag: "ValidationClientError",
      error: { _tag: "InvalidQueryError" },
    }),
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

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) => Effect.either(client.hello({}))),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual(
    Either.left({
      _tag: "HttpClientError",
      statusCode: 404,
      error: {
        error: "NotFoundError",
        details: "Didnt find it",
      },
    }),
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

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      client.hello({ headers: { "x-client-id": "abc" } }),
    ),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual({
    clientIdHash: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=",
  });
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

    const result = await pipe(
      testServer(server),
      Effect.flatMap((client) => Effect.either(client.hello({}))),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(result).toMatchObject(
      Either.left({
        statusCode: Http.API_STATUS_CODES[errorTag],
      }),
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
      // @ts-expect-error
      Http.handle("nonExistingOperation", () => ""),
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
        new Response(JSON.stringify({ value: "test" }), {
          status: 201,
          headers: new Headers({ "Content-Type": "application/json" }),
        }),
      ),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      client.hello({ headers: { "x-client-id": "abc" } }),
    ),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual({ value: "test" });
});

test("Express interop example", async () => {
  const legacyApp = express();

  legacyApp.get("/legacy-endpoint", (_, res) => {
    res.json({ hello: "world" });
  });

  const api = pipe(
    Http.api(),
    Http.get("newEndpoint", "/new-endpoint", {
      response: Schema.struct({ hello: Schema.string }),
    }),
  );

  const server = pipe(
    Http.server(api),
    Http.handle("newEndpoint", () => Effect.succeed({ hello: "new world" })),
    Http.exhaustive,
  );

  const result = await pipe(
    server,
    Http.express({ logger: "none" }),
    Effect.map((app) => {
      app.use(legacyApp);
      return app;
    }),
    Effect.flatMap(testExpress(api)),
    Effect.flatMap(([client]) => client.newEndpoint({})),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual({ hello: "new world" });
});

test("Response containing optional field", async () => {
  const Response = Schema.struct({
    foo: Schema.optional(Schema.string).toOption(),
  });

  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Response,
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", () => Effect.succeed({ foo: Option.none() })),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) => Effect.all([client.hello({}), client.hello()])),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual([{ foo: Option.none() }, { foo: Option.none() }]);
});

const helloApi = pipe(
  Http.api(),
  Http.get("hello", "/hello", {
    response: Schema.string,
  }),
);

test("failing after handler extension", async () => {
  const server = pipe(
    helloApi,
    Http.server,
    Http.handle("hello", () => Effect.succeed("test")),
    Http.addExtension(
      Http.beforeHandlerExtension("test", () =>
        Effect.fail(Http.unauthorizedError("sorry bro")),
      ),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) => client.hello({})),
    Effect.either,
    Effect.scoped,
    Effect.runPromise,
  );

  expect(result).toEqual(
    Either.left(
      Http.httpClientError(
        { error: "UnauthorizedError", details: "sorry bro" },
        401,
      ),
    ),
  );
});

describe("type safe responses", () => {
  test("responses must have unique status codes", () => {
    expect(() => {
      pipe(
        Http.api(),
        Http.post("hello", "/hello", {
          response: [{ status: 201 }, { status: 201 }],
        }),
      );
    }).toThrowError();
  });

  test("example", async () => {
    const api = pipe(
      Http.api(),
      Http.post("hello", "/hello", {
        response: [
          {
            status: 201,
            content: Schema.number,
          },
          {
            status: 200,
            content: Schema.number,
            headers: { "X-Another-200": Schema.NumberFromString },
          },
          {
            status: 204,
            headers: { "X-Another": Schema.NumberFromString },
          },
        ],
        query: {
          value: Schema.NumberFromString,
        },
      }),
    );

    const server = pipe(
      Http.server(api),
      Http.handle("hello", ({ query: { value } }) => {
        const response =
          value == 12
            ? ({
                status: 200,
                content: 12,
                headers: { "x-another-200": 12 },
              } as const)
            : value == 13
            ? ({ status: 201, content: 13 } as const)
            : ({ status: 204, headers: { "x-another": 13 } } as const);

        return Effect.succeed(response);
      }),
    );

    const result = await pipe(
      testServer(server),
      Effect.flatMap((client) =>
        Effect.all([
          client.hello({ query: { value: 12 } }),
          client.hello({ query: { value: 13 } }),
          client.hello({ query: { value: 14 } }),
        ]),
      ),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(result).toMatchObject([
      { content: 12, headers: { "x-another-200": 12 }, status: 200 },
      { content: 13, headers: {}, status: 201 },
      { content: undefined, headers: { "x-another": 13 }, status: 204 },
    ]);
  });
});
