import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import { Effect, Option } from "effect";
import { Testing } from "effect-http";
import * as RouterBuilder from "effect-http/RouterBuilder";
import { apply } from "effect/Function";

import {
  exampleApiFullResponse,
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetOptionalField,
  exampleApiGetQueryParameter,
  exampleApiParams,
  exampleApiPostNullableField,
  exampleApiRepresentations,
  exampleApiRequestBody,
  exampleApiRequestHeaders,
} from "./examples";
import { runTestEffect } from "./utils";

const exampleRouteGetQueryParameter = exampleApiGetQueryParameter.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ query }) => Effect.succeed(query.country)),
  RouterBuilder.getRouter,
);

const exampleRouteRequestBody = exampleApiRequestBody.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ body }) => Effect.succeed(body.foo)),
  RouterBuilder.getRouter,
);

const exampleRouteRequestHeaders = exampleApiRequestHeaders.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ headers }) =>
    Effect.succeed(headers["x-header"]),
  ),
  RouterBuilder.getRouter,
);

const exampleRouteParams = exampleApiParams.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ params }) => Effect.succeed(params.value)),
  RouterBuilder.getRouter,
);

describe("examples", () => {
  test("get", async () => {
    const router = exampleApiGet.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("getValue", () => Effect.succeed(12)),
      RouterBuilder.getRouter,
    );

    const response = await Testing.makeRaw(router).pipe(
      Effect.flatMap(apply(ClientRequest.get("/get-value"))),
      runTestEffect,
    );
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual(12);
  });

  test("post, optional body field", async () => {
    const router = exampleApiPostNullableField.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("test", () =>
        Effect.succeed({ value: Option.some("test") }),
      ),
      RouterBuilder.getRouter,
    );

    const response = await Testing.makeRaw(router).pipe(
      Effect.flatMap(apply(ClientRequest.post("/test"))),
      runTestEffect,
    );
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual({ value: "test" });
  });

  test("get, query parameter", async () => {
    const response = await Testing.makeRaw(exampleRouteGetQueryParameter).pipe(
      Effect.flatMap(
        apply(
          ClientRequest.get("/hello").pipe(
            ClientRequest.appendUrlParam("country", "CZ"),
          ),
        ),
      ),
      runTestEffect,
    );
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual("CZ");
  });

  test("get, custom headers and status", async () => {
    const router = exampleApiGetCustomResponseWithHeaders.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("hello", () =>
        Effect.succeed({
          status: 201,
          headers: { "my-header": "hello" },
          content: { value: "test" },
        } as const),
      ),
      RouterBuilder.getRouter,
    );

    const response = await Testing.makeRaw(router).pipe(
      Effect.flatMap(apply(ClientRequest.get("/hello"))),
      runTestEffect,
    );
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(201);
    expect(response.headers).toMatchObject({
      "my-header": "hello",
    });
    expect(body).toEqual({ value: "test" });
  });

  test("get, optional field", async () => {
    const router = exampleApiGetOptionalField.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("hello", ({ query }) =>
        Effect.succeed({
          foo: query.value === "on" ? Option.some("hello") : Option.none(),
        }),
      ),
      RouterBuilder.getRouter,
    );

    const response = await Testing.makeRaw(router).pipe(
      Effect.flatMap(
        apply(
          ClientRequest.get("/hello").pipe(
            ClientRequest.setUrlParam("value", "off"),
          ),
        ),
      ),
      runTestEffect,
    );
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual({});
  });

  test("post, request body", async () => {
    const response = await Testing.makeRaw(exampleRouteRequestBody).pipe(
      Effect.flatMap(
        apply(
          ClientRequest.post("/hello").pipe(
            ClientRequest.unsafeJsonBody({ foo: "hello" }),
          ),
        ),
      ),
      runTestEffect,
    );

    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual("hello");
  });

  test("path parameters", async () => {
    const response = await Testing.makeRaw(exampleRouteParams).pipe(
      Effect.flatMap(apply(ClientRequest.post("/hello/a"))),
      runTestEffect,
    );

    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual("a");
  });
});

describe("error reporting", () => {
  test("missing query parameter", async () => {
    const response = await Testing.makeRaw(exampleRouteGetQueryParameter).pipe(
      Effect.flatMap(apply(ClientRequest.get("/hello"))),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "query",
      message: "country is missing",
    });
  });

  test("invalid query parameter", async () => {
    const response = await Testing.makeRaw(exampleRouteGetQueryParameter).pipe(
      Effect.flatMap(
        apply(
          ClientRequest.get("/hello").pipe(
            ClientRequest.setUrlParam("country", "CZE"),
          ),
        ),
      ),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "query",
      message:
        'country must be a string matching the pattern ^[A-Z]{2}$, received "CZE"',
    });
  });

  test("invalid JSON body - empty", async () => {
    const response = await Testing.makeRaw(exampleRouteRequestBody).pipe(
      Effect.flatMap(apply(ClientRequest.post("/hello"))),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "body",
      message: "must be an object, received null",
    });
  });

  test("invalid JSON body - text", async () => {
    const response = await Testing.makeRaw(exampleRouteRequestBody).pipe(
      Effect.flatMap(
        apply(
          ClientRequest.post("/hello").pipe(ClientRequest.textBody("value")),
        ),
      ),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "body",
      message: "Invalid JSON",
    });
  });

  test("invalid JSON body - incorrect schema", async () => {
    const response = await Testing.makeRaw(exampleRouteRequestBody).pipe(
      Effect.flatMap(
        apply(
          ClientRequest.post("/hello").pipe(
            ClientRequest.unsafeJsonBody({ foo: 1 }),
          ),
        ),
      ),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "body",
      message: "foo must be string, received 1",
    });
  });

  test("invalid header", async () => {
    const response = await Testing.makeRaw(exampleRouteRequestHeaders).pipe(
      Effect.flatMap(apply(ClientRequest.post("/hello"))),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "headers",
      message: "x-header is missing",
    });
  });

  test("invalid param", async () => {
    const response = await Testing.makeRaw(exampleRouteParams).pipe(
      Effect.flatMap(apply(ClientRequest.post("/hello/c"))),
      runTestEffect,
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "path",
      message: 'value must be "a" or "b", received "c"',
    });
  });

  test("invalid response", async () => {
    const exampleRouteInvalid = exampleApiParams.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("hello", () =>
        Effect.succeed(1 as unknown as string),
      ),
      RouterBuilder.getRouter,
    );

    const response = await Testing.makeRaw(exampleRouteInvalid).pipe(
      Effect.flatMap(apply(ClientRequest.post("/hello/a"))),
      runTestEffect,
    );

    expect(response.status).toEqual(500);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Invalid response content",
      message: "must be string, received 1",
    });
  });
});

test("single full response", async () => {
  const app = exampleApiFullResponse.pipe(
    RouterBuilder.make,
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
    RouterBuilder.getRouter,
  );

  const [response1, response2] = await Testing.makeRaw(app).pipe(
    Effect.flatMap((client) =>
      Effect.all([
        client(ClientRequest.post("/hello")),
        client(ClientRequest.post("/another")),
      ]),
    ),
    runTestEffect,
  );

  expect(response1.status).toEqual(200);
  expect(await Effect.runPromise(response1.json)).toEqual(12);
  expect(response1.headers).toMatchObject({ "my-header": "test" });

  expect(await Effect.runPromise(response2.json)).toEqual(12);
  expect(response2.status).toEqual(200);
});

test("representations", async () => {
  const app = exampleApiRepresentations.pipe(
    RouterBuilder.make,
    RouterBuilder.handle("test", () =>
      Effect.succeed({ content: "test", status: 200 as const }),
    ),
    RouterBuilder.getRouter,
  );

  const [textResponse, jsonResponse] = await Testing.makeRaw(app).pipe(
    Effect.flatMap((client) =>
      Effect.all([
        client(
          ClientRequest.post("/test").pipe(ClientRequest.accept("text/plain")),
        ),
        client(
          ClientRequest.post("/test").pipe(
            ClientRequest.accept("application/json"),
          ),
        ),
      ]),
    ),
    runTestEffect,
  );

  expect(textResponse.status).toEqual(200);
  expect(await Effect.runPromise(textResponse.text)).toEqual("test");
  expect(textResponse.headers["content-type"]).toEqual("text/plain");

  expect(await Effect.runPromise(jsonResponse.json)).toEqual("test");
  expect(jsonResponse.status).toEqual(200);
  expect(jsonResponse.headers["content-type"]).toEqual("application/json");
});
