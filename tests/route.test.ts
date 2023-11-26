import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as HttpServer from "@effect/platform/HttpServer";
import { Effect, Option } from "effect";
import { Route, Testing } from "effect-http";
import { apply } from "effect/Function";

import {
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetOptionalField,
  exampleApiGetQueryParameter,
  exampleApiMultipleQueryValues,
  exampleApiParams,
  exampleApiPostNullableField,
  exampleApiRequestBody,
  exampleApiRequestHeaders,
} from "./examples";
import { runTestEffect } from "./utils";

const testRoute = <R, E>(
  route: HttpServer.router.Route<R, E>,
  request: ClientRequest.ClientRequest,
) =>
  Testing.makeRaw(HttpServer.router.fromIterable([route])).pipe(
    Effect.flatMap(apply(request)),
  );

const exampleRouteGetQueryParameter = exampleApiGetQueryParameter.pipe(
  Route.make("hello", ({ query }) => Effect.succeed(query.country)),
);

const exampleRouteRequestBody = exampleApiRequestBody.pipe(
  Route.make("hello", ({ body }) => Effect.succeed(body.foo)),
);

const exampleRouteRequestHeaders = exampleApiRequestHeaders.pipe(
  Route.make("hello", ({ headers }) => Effect.succeed(headers["x-header"])),
);

const exampleRouteParams = exampleApiParams.pipe(
  Route.make("hello", ({ params }) => Effect.succeed(params.value)),
);

const exampleMultipleQueryAllErrors = exampleApiMultipleQueryValues.pipe(
  Route.make(
    "test",
    ({ query }) => Effect.succeed(`${query.value}, ${query.value}`),
    { parseOptions: { errors: "all" } },
  ),
);

const exampleMultipleQueryFirstError = exampleApiMultipleQueryValues.pipe(
  Route.make("test", ({ query }) =>
    Effect.succeed(`${query.value}, ${query.value}`),
  ),
);

describe("examples", () => {
  test("get", async () => {
    const route = exampleApiGet.pipe(
      Route.make("getValue", () => Effect.succeed(12)),
    );

    const response = await testRoute(
      route,
      ClientRequest.get("/get-value"),
    ).pipe(runTestEffect);
    const body = await Effect.runPromise(response.json);

    expect(body).toEqual(12);
  });

  test("post, optional body field", async () => {
    const route = exampleApiPostNullableField.pipe(
      Route.make("test", () => Effect.succeed({ value: Option.some("test") })),
    );

    const response = await testRoute(route, ClientRequest.post("/test")).pipe(
      runTestEffect,
    );
    const body = await Effect.runPromise(response.json);

    expect(body).toEqual({ value: "test" });
  });

  test("get, query parameter", async () => {
    const response = await testRoute(
      exampleRouteGetQueryParameter,
      ClientRequest.get("/hello").pipe(
        ClientRequest.appendUrlParam("country", "CZ"),
      ),
    ).pipe(runTestEffect);
    const body = await Effect.runPromise(response.json);

    expect(body).toEqual("CZ");
  });

  test("get, custom headers and status", async () => {
    const route = exampleApiGetCustomResponseWithHeaders.pipe(
      Route.make("hello", () =>
        Effect.succeed({
          status: 201,
          headers: { "my-header": "hello" },
          content: { value: "test" },
        } as const),
      ),
    );

    const response = await testRoute(route, ClientRequest.get("/hello")).pipe(
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
    const route = exampleApiGetOptionalField.pipe(
      Route.make("hello", ({ query }) =>
        Effect.succeed({
          foo: query.value === "on" ? Option.some("hello") : Option.none(),
        }),
      ),
    );

    const response = await testRoute(
      route,
      ClientRequest.get("/hello").pipe(
        ClientRequest.setUrlParam("value", "off"),
      ),
    ).pipe(runTestEffect);
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual({});
  });

  test("post, request body", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("/hello").pipe(
        ClientRequest.unsafeJsonBody({ foo: "hello" }),
      ),
    ).pipe(runTestEffect);

    const body = await Effect.runPromise(response.json);

    expect(body).toEqual("hello");
  });

  test("path parameters", async () => {
    const response = await testRoute(
      exampleRouteParams,
      ClientRequest.post("/hello/a"),
    ).pipe(runTestEffect);

    const body = await Effect.runPromise(response.json);

    expect(body).toEqual("a");
  });
});

describe("error reporting", () => {
  test("missing query parameter", async () => {
    const response = await testRoute(
      exampleRouteGetQueryParameter,
      ClientRequest.get("/hello"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "query",
      message: "country is missing",
    });
  });

  test("invalid query parameter", async () => {
    const response = await testRoute(
      exampleRouteGetQueryParameter,
      ClientRequest.get("/hello").pipe(
        ClientRequest.setUrlParam("country", "CZE"),
      ),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "query",
      message:
        'country must be a string matching the pattern ^[A-Z]{2}$, received "CZE"',
    });
  });

  test("invalid JSON body - empty", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("/hello"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "body",
      message: "must be an object, received null",
    });
  });

  test("invalid JSON body - text", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("/hello").pipe(ClientRequest.textBody("value")),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "body",
      message: "Invalid JSON",
    });
  });

  test("invalid JSON body - incorrect schema", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("/hello").pipe(
        ClientRequest.unsafeJsonBody({ foo: 1 }),
      ),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "body",
      message: "foo must be string, received 1",
    });
  });

  test("invalid header", async () => {
    const response = await testRoute(
      exampleRouteRequestHeaders,
      ClientRequest.post("/hello"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "headers",
      message: "x-header is missing",
    });
  });

  test("invalid param", async () => {
    const response = await testRoute(
      exampleRouteParams,
      ClientRequest.post("/hello/c"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "path",
      message: 'value must be "a" or "b", received "c"',
    });
  });

  test("invalid response", async () => {
    const exampleRouteInvalid = exampleApiParams.pipe(
      Route.make("hello", () => Effect.succeed(1 as unknown as string)),
    );

    const response = await testRoute(
      exampleRouteInvalid,
      ClientRequest.post("/hello/a"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(500);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Invalid response content",
      message: "must be string, received 1",
    });
  });

  test("multiple errors", async () => {
    const response = await testRoute(
      exampleMultipleQueryAllErrors,
      ClientRequest.post("/test"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "query",
      message: "another is missing, value is missing",
    });
  });

  test("multiple errors", async () => {
    const response = await testRoute(
      exampleMultipleQueryFirstError,
      ClientRequest.post("/test"),
    ).pipe(runTestEffect);

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual({
      error: "Request validation error",
      location: "query",
      message: "another is missing",
    });
  });
});
