import express from "express";
import { createHash } from "node:crypto";

import { Schema } from "@effect/schema";
import {
  Context,
  Effect,
  Either,
  Layer,
  Option,
  ReadonlyArray,
  pipe,
} from "effect";
import * as Http from "effect-http";

import {
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetHeaders,
  exampleApiGetOptionalField,
  exampleApiGetQueryParameter,
  exampleApiGetStringResponse,
} from "./examples";
import { runTestEffect, testExpress, testServer } from "./utils";

const Service1 = Context.Tag<number>();
const Service2 = Context.Tag<string>();

const layer1 = Layer.succeed(Service2, "hello world");
const layer2 = pipe(
  Effect.map(Service2, (value) => value.length),
  Layer.effect(Service1),
);

test("layers", async () => {
  const layer = Layer.provide(layer1, layer2);

  const server = exampleApiGet.pipe(
    Http.server,
    Http.handle("getValue", () => Effect.map(Service1, (value) => value + 2)),
    Http.exhaustive,
  );

  const response = await pipe(
    testServer(server),
    Effect.provide(layer),
    Effect.flatMap((client) => client.getValue({})),
    runTestEffect,
  );

  expect(response).toEqual(13);
});

// TODO: this is actually not testing the server because the error occurs
// on the client side
test("validation error", async () => {
  const server = Http.exampleServer(exampleApiGetQueryParameter);

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.either(client.hello({ query: { country: "abc" } })),
    ),
    runTestEffect,
  );

  expect(result).toMatchObject(Either.left({ _tag: "QueryEncodeError" }));
});

test("human-readable error response", async () => {
  const server = exampleApiGetStringResponse.pipe(
    Http.server,
    Http.handle("hello", () =>
      Effect.fail(Http.notFoundError("Didnt find it")),
    ),
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) => Effect.either(client.hello({}))),
    runTestEffect,
  );

  expect(result).toEqual(
    Either.left({
      _tag: "HttpClientError",
      status: 404,
      error: {
        error: "NotFoundError",
        details: "Didnt find it",
      },
    }),
  );
});

test("headers", async () => {
  const server = pipe(
    exampleApiGetHeaders,
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
    runTestEffect,
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
      runTestEffect,
    );

    expect(result).toMatchObject(
      Either.left({
        status: Http.API_STATUS_CODES[errorTag],
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

test("Custom headers and status", async () => {
  const server = pipe(
    exampleApiGetCustomResponseWithHeaders,
    Http.server,
    Http.handle("hello", () =>
      Effect.succeed({
        content: { value: "test" },
        headers: { "my-header": "hello" },
        status: 201,
      } as const),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      // TODO: this header is not necessary, it is provided intentionally?
      client.hello({ headers: { "x-client-id": "abc" } }),
    ),
    runTestEffect,
  );

  expect(result).toEqual({
    status: 201,
    content: { value: "test" },
    headers: { "my-header": "hello" },
  });
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
    Http.express(),
    Effect.map((app) => {
      app.use(legacyApp);
      return app;
    }),
    Effect.flatMap(testExpress(api)),
    Effect.flatMap(([client]) => client.newEndpoint({})),
    runTestEffect,
  );

  expect(result).toEqual({ hello: "new world" });
});

test("Response containing optional field", async () => {
  const server = pipe(
    exampleApiGetOptionalField,
    Http.server,
    Http.handle("hello", ({ query }) =>
      Effect.succeed({
        foo: query.value === "on" ? Option.some("hello") : Option.none(),
      }),
    ),
    Http.exhaustive,
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.all([
        client.hello({ query: { value: "on" } }),
        client.hello({ query: { value: "off" } }),
      ]),
    ),
    runTestEffect,
  );

  expect(result).toEqual([
    { foo: Option.some("hello") },
    { foo: Option.none() },
  ]);
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
    runTestEffect,
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
            headers: Schema.struct({
              "X-Another-200": Schema.NumberFromString,
            }),
          },
          {
            status: 204,
            headers: Schema.struct({ "X-Another": Schema.NumberFromString }),
          },
        ],
        request: {
          query: Schema.struct({
            value: Schema.NumberFromString,
          }),
        },
      }),
    );

    const server = pipe(
      Http.server(api),
      Http.handle("hello", ({ query: { value } }) => {
        const response =
          value == 12
            ? {
                content: 12,
                headers: { "x-another-200": 12 },
                status: 200 as const,
              }
            : value == 13
            ? { content: 13, status: 201 as const }
            : { headers: { "x-another": 13 }, status: 204 as const };

        return Effect.succeed(response);
      }),
    );

    const result = await pipe(
      testServer(server),
      Effect.flatMap((client) =>
        Effect.all(
          ReadonlyArray.map([12, 13, 14], (value) =>
            client.hello({ query: { value } }),
          ),
        ),
      ),
      runTestEffect,
    );

    expect(result).toMatchObject([
      { content: 12, headers: { "x-another-200": 12 }, status: 200 },
      { content: 13, headers: {}, status: 201 },
      { content: undefined, headers: { "x-another": 13 }, status: 204 },
    ]);
  });
});

test("optional headers / query / params fields", async () => {
  const api = pipe(
    Http.api(),
    Http.post("hello", "/hello/:value/another/:another?", {
      response: Schema.struct({
        query: Schema.struct({
          value: Schema.number,
          another: Schema.optional(Schema.string),
        }),
        params: Schema.struct({
          value: Schema.number,
          another: Schema.optional(Schema.string),
        }),
        headers: Schema.struct({
          value: Schema.number,
          another: Schema.optional(Schema.string),
          hello: Schema.optional(Schema.string),
        }),
      }),
      request: {
        query: Schema.struct({
          value: Schema.NumberFromString,
          another: Schema.optional(Schema.string),
        }),
        params: Schema.struct({
          value: Schema.NumberFromString,
          another: Schema.optional(Schema.string),
        }),
        headers: Schema.struct({
          value: Schema.NumberFromString,
          another: Schema.optional(Schema.string),
          hello: Schema.optional(Schema.string),
        }),
      },
    }),
  );

  const server = pipe(
    Http.server(api),
    Http.handle("hello", ({ query, params, headers }) =>
      Effect.succeed({ query, params, headers }),
    ),
  );

  const params = [
    {
      query: { value: 12 },
      headers: { value: 12 },
      params: { value: 12 },
    },
    {
      query: { value: 12, another: "query-another-2" },
      headers: { value: 12 },
      params: { value: 12, another: "params-another-2" },
    },
    {
      query: { value: 12 },
      headers: {
        value: 12,
        another: "headers-another-3",
        hello: "params-hello-3",
      },
      params: { value: 12 },
    },
  ] as const;

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.all(ReadonlyArray.map(params, client.hello)),
    ),
    runTestEffect,
  );

  expect(result).toStrictEqual(params);
});

test.each([
  { path: "/users", input: "/users", expected: {} },
  { path: "/users/:name", input: "/users/hello", expected: { name: "hello" } },
  {
    path: "/users/:name/:another?",
    input: "/users/hello",
    expected: { name: "hello" },
  },
  {
    path: "/users/:name/hello/:another?",
    input: "/users/test/hello/another",
    expected: { name: "test", another: "another" },
  },
])("params matcher %#", ({ path, input, expected }) => {
  const matcher = Http.createParamsMatcher(path);
  expect(matcher(new URL(input, "http://localhost:3000/"))).toEqual(expected);
});

test("optional parameters", async () => {
  const api = pipe(
    Http.api(),
    Http.post("hello", "/hello/:value/another/:another?", {
      response: Schema.struct({
        params: Schema.struct({
          value: Schema.number,
          another: Schema.optional(Schema.string),
        }),
      }),
      request: {
        params: Schema.struct({
          value: Schema.NumberFromString,
          another: Schema.optional(Schema.string),
        }),
      },
    }),
  );

  const server = pipe(
    Http.server(api),
    Http.handle("hello", ({ params }) => Effect.succeed({ params })),
  );

  const params = [
    { params: { value: 12 } },
    { params: { value: 12, another: "another" } },
  ] as const;

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.all(ReadonlyArray.map(params, client.hello)),
    ),
    runTestEffect,
  );

  expect(result).toStrictEqual(params);
});

test("single full response", async () => {
  const api = pipe(
    Http.api(),
    Http.post("hello", "/hello", {
      response: {
        status: 200,
        content: Schema.number,
        headers: Schema.struct({
          "My-Header": Schema.string,
        }),
      },
    }),
    Http.post("another", "/another", {
      response: {
        status: 200,
        content: Schema.number,
      },
    }),
  );

  const server = pipe(
    Http.server(api),
    Http.handle("hello", () =>
      Effect.succeed({
        content: 12,
        headers: { "my-header": "test" },
        status: 200 as const,
      }),
    ),
    Http.handle("another", () =>
      Effect.succeed({ content: 12, status: 200 as const }),
    ),
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) => Effect.all([client.hello(), client.another()])),
    runTestEffect,
  );

  expect(result).toMatchObject([
    {
      status: 200,
      content: 12,
      headers: { "my-header": "test" },
    },
    {
      status: 200,
      content: 12,
    },
  ]);
});
