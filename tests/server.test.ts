import express from "express";
import { createHash } from "node:crypto";

import * as Context from "@effect/data/Context";
import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

import { runTestEffect, testExpress, testServer } from "./utils";

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
    runTestEffect,
  );

  expect(response).toEqual(13);
});

test("validation error", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      request: {
        query: Schema.struct({
          country: pipe(Schema.string, Schema.pattern(/^[A-Z]{2}$/)),
        }),
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
    runTestEffect,
  );

  expect(result).toMatchObject(
    Either.left(Http.validationClientError({ _tag: "InvalidQueryError" })),
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
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.struct({ clientIdHash: Schema.string }),
      request: {
        headers: Schema.struct({ "X-Client-Id": Schema.string }),
      },
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
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: {
        status: 201,
        content: Schema.struct({ value: Schema.string }),
        headers: Schema.struct({
          "Content-Type": Schema.literal("application/json"),
        }),
      },
    }),
  );

  const server = pipe(
    api,
    Http.server,
    Http.handle("hello", ({ ResponseUtil }) =>
      Effect.succeed(
        ResponseUtil.response201({
          content: { value: "test" },
          headers: { "content-type": "application/json" },
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
    runTestEffect,
  );

  expect(result).toEqual({
    status: 201,
    content: { value: "test" },
    headers: { "content-type": "application/json" },
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
    runTestEffect,
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
      Http.handle("hello", ({ query: { value }, ResponseUtil }) => {
        const response =
          value == 12
            ? ResponseUtil.response200({
                content: 12,
                headers: { "x-another-200": 12 },
              })
            : value == 13
            ? ResponseUtil.response201({ content: 13 })
            : ResponseUtil.response204({ headers: { "x-another": 13 } });

        return Effect.succeed(response);
      }),
    );

    const result = await pipe(
      testServer(server),
      Effect.flatMap((client) =>
        Effect.all(
          RA.map([12, 13, 14], (value) => client.hello({ query: { value } })),
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
    Effect.flatMap((client) => Effect.all(RA.map(params, client.hello))),
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
    Effect.flatMap((client) => Effect.all(RA.map(params, client.hello))),
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
    Http.handle("hello", ({ ResponseUtil }) =>
      Effect.succeed(
        ResponseUtil.response200({
          content: 12,
          headers: { "my-header": "test" },
        }),
      ),
    ),
    Http.handle("another", ({ ResponseUtil }) =>
      Effect.succeed(ResponseUtil.response200({ content: 12 })),
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
