import { createHash } from "node:crypto";

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
import { Api, RouterBuilder, ServerError } from "effect-http";

import {
  exampleApiFullResponse,
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetHeaders,
  exampleApiGetOptionalField,
  exampleApiGetStringResponse,
  exampleApiMultipleResponses,
  exampleApiOptional,
  exampleApiOptionalParams,
  exampleApiPutResponse,
} from "./examples";
import { runTestEffect, testApp } from "./utils";

const Service1 = Context.Tag<number>();
const Service2 = Context.Tag<string>();

const layer1 = Layer.succeed(Service2, "hello world");
const layer2 = pipe(
  Effect.map(Service2, (value) => value.length),
  Layer.effect(Service1),
);

test("layers", async () => {
  const layer = Layer.provide(layer1, layer2);

  const app = RouterBuilder.make(exampleApiGet).pipe(
    RouterBuilder.handle("getValue", () =>
      Effect.map(Service1, (value) => value + 2),
    ),
    RouterBuilder.build,
  );

  const response = await pipe(
    app,
    testApp(exampleApiGet),
    Effect.provide(layer),
    Effect.flatMap((client) => client.getValue({})),
    runTestEffect,
  );

  expect(response).toEqual(13);
});

test("human-readable error response", async () => {
  const app = RouterBuilder.make(exampleApiGetStringResponse).pipe(
    RouterBuilder.handle("hello", () =>
      Effect.fail(ServerError.notFoundError("Didnt find it")),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(exampleApiGetStringResponse),
    Effect.flatMap((client) => client.hello({})),
    Effect.flip,
    runTestEffect,
  );

  expect(result).toMatchObject({
    _tag: "HttpClientError",
    status: 404,
    error: {
      error: "NotFoundError",
      details: "Didnt find it",
    },
  });
});

test("headers", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiGetHeaders),
    RouterBuilder.handle("hello", ({ headers: { "x-client-id": apiKey } }) =>
      Effect.succeed({
        clientIdHash: createHash("sha256").update(apiKey).digest("base64"),
      }),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(exampleApiGetHeaders),
    Effect.flatMap((client) =>
      client.hello({ headers: { "x-client-id": "abc" } }),
    ),
    runTestEffect,
  );

  expect(result).toEqual({
    clientIdHash: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=",
  });
});

test.each(ServerError.API_ERROR_TAGS as ServerError.ApiError["_tag"][])(
  "status codes",
  async (errorTag) => {
    const app = pipe(
      RouterBuilder.make(exampleApiGetStringResponse),
      RouterBuilder.handle("hello", () =>
        Effect.fail({ _tag: errorTag, error: "failure" }),
      ),
      RouterBuilder.build,
    );

    const result = await pipe(
      app,
      testApp(exampleApiGetStringResponse),
      Effect.flatMap((client) => Effect.either(client.hello({}))),
      runTestEffect,
    );

    expect(result).toMatchObject(
      Either.left({
        status: ServerError.API_STATUS_CODES[errorTag],
      }),
    );
  },
);

test("Attempt to add a non-existing operation should fail as a safe guard", () => {
  expect(() =>
    RouterBuilder.make(exampleApiPutResponse).pipe(
      // @ts-expect-error
      RouterBuilder.handle("nonExistingOperation", () => ""),
    ),
  ).toThrowError();
});

test("Custom headers and status", async () => {
  const app = exampleApiGetCustomResponseWithHeaders.pipe(
    RouterBuilder.make,
    RouterBuilder.handle("hello", () =>
      Effect.succeed({
        content: { value: "test" },
        headers: { "my-header": "hello" },
        status: 201,
      } as const),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(exampleApiGetCustomResponseWithHeaders),
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

test("Response containing optional field", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiGetOptionalField),
    RouterBuilder.handle("hello", ({ query }) =>
      Effect.succeed({
        foo: query.value === "on" ? Option.some("hello") : Option.none(),
      }),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(exampleApiGetOptionalField),
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

// test("failing after handler extension", async () => {
//   const server = RouterBuilder.make(exampleApiGetStringResponse).pipe(
//     RouterBuilder.handle("hello", () => Effect.succeed(1)),
//     RouterBuilder.addExtension(
//       Http.beforeHandlerExtension("test", () =>
//         Effect.fail(ServerError.unauthorizedError("sorry bro")),
//       ),
//     ),
//     RouterBuilder.exhaustive,
//   );
//
//   const result = await pipe(
//     testServer(server),
//     Effect.flatMap((client) => client.hello({})),
//     Effect.either,
//     runTestEffect,
//   );
//
//   expect(result).toEqual(
//     Either.left(
//       Http.HttpClientError.create(
//         { error: "UnauthorizedError", details: "sorry bro" },
//         401,
//       ),
//     ),
//   );
// });

describe("type safe responses", () => {
  test("responses must have unique status codes", () => {
    expect(() => {
      pipe(
        Api.api(),
        Api.post("hello", "/hello", {
          response: [{ status: 201 }, { status: 201 }],
        }),
      );
    }).toThrowError();
  });

  test("example", async () => {
    const app = RouterBuilder.make(exampleApiMultipleResponses).pipe(
      RouterBuilder.handle("hello", ({ query: { value } }) => {
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
      RouterBuilder.build,
    );

    const result = await pipe(
      app,
      testApp(exampleApiMultipleResponses),
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
  const app = pipe(
    RouterBuilder.make(exampleApiOptional),
    RouterBuilder.handle("hello", ({ query, params, headers }) =>
      Effect.succeed({ query, params, headers }),
    ),
    RouterBuilder.build,
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
    app,
    testApp(exampleApiOptional),
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
  const app = pipe(
    RouterBuilder.make(exampleApiOptionalParams),
    RouterBuilder.handle("hello", ({ params }) => Effect.succeed({ params })),
    RouterBuilder.build,
  );

  const params = [
    { params: { value: 12 } },
    { params: { value: 12, another: "another" } },
  ] as const;

  const result = await pipe(
    app,
    testApp(exampleApiOptionalParams),
    Effect.flatMap((client) =>
      Effect.all(ReadonlyArray.map(params, client.hello)),
    ),
    runTestEffect,
  );

  expect(result).toStrictEqual(params);
});

test("single full response", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiFullResponse),
    RouterBuilder.handle("hello", () =>
      Effect.succeed({
        content: 12,
        headers: { "my-header": "test" },
        status: 200 as const,
      }),
    ),
    RouterBuilder.handle("another", () =>
      Effect.succeed({ content: 12, status: 200 as const }),
    ),
    RouterBuilder.build,
  );

  const result = await pipe(
    app,
    testApp(exampleApiFullResponse),
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
