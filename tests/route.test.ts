import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as HttpServer from "@effect/platform/HttpServer";
import { Effect, Option } from "effect";
import * as Route from "effect-http/Route";
import * as ServerError from "effect-http/ServerError";

import {
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetOptionalField,
  exampleApiGetQueryParameter,
  exampleApiParams,
  exampleApiPostNullableField,
  exampleApiRequestBody,
  exampleApiRequestHeaders,
} from "./examples";
import { testRouter } from "./utils";

const testRoute = <E1>(
  route: HttpServer.router.Route<never, E1>,
  request: ClientRequest.ClientRequest,
) =>
  testRouter(HttpServer.router.fromIterable([route]), request).pipe(
    Effect.runPromise,
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

describe("examples", () => {
  test("get", async () => {
    const route = exampleApiGet.pipe(
      Route.make("getValue", () => Effect.succeed(12)),
    );

    const response = await testRoute(route, ClientRequest.get("get-value"));
    const body = await Effect.runPromise(response.json);

    expect(body).toEqual(12);
  });

  test("post, optional body field", async () => {
    const route = exampleApiPostNullableField.pipe(
      Route.make("test", () => Effect.succeed({ value: Option.some("test") })),
    );

    const response = await testRoute(route, ClientRequest.post("test"));
    const body = await Effect.runPromise(response.json);

    expect(body).toEqual({ value: "test" });
  });

  test("get, query parameter", async () => {
    const response = await testRoute(
      exampleRouteGetQueryParameter,
      ClientRequest.get("hello").pipe(
        ClientRequest.appendUrlParam("country", "CZ"),
      ),
    );
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

    const response = await testRoute(route, ClientRequest.get("hello"));
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
      ClientRequest.get("hello").pipe(
        ClientRequest.setUrlParam("value", "off"),
      ),
    );
    const body = await Effect.runPromise(response.json);

    expect(response.status).toEqual(200);
    expect(body).toEqual({});
  });

  test("post, request body", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("hello").pipe(
        ClientRequest.unsafeJsonBody({ foo: "hello" }),
      ),
    );

    const body = await Effect.runPromise(response.json);

    expect(body).toEqual("hello");
  });

  test("path parameters", async () => {
    const response = await testRoute(
      exampleRouteParams,
      ClientRequest.post("hello/a"),
    );

    const body = await Effect.runPromise(response.json);

    expect(body).toEqual("a");
  });
});

describe("error reporting", () => {
  test("missing query parameter", async () => {
    const response = await testRoute(
      exampleRouteGetQueryParameter,
      ClientRequest.get("hello"),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidQueryError("country is missing"),
    );
  });

  test("invalid query parameter", async () => {
    const response = await testRoute(
      exampleRouteGetQueryParameter,
      ClientRequest.get("hello").pipe(
        ClientRequest.setUrlParam("country", "CZE"),
      ),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidQueryError(
        'country must be a string matching the pattern ^[A-Z]{2}$, received "CZE"',
      ),
    );
  });

  test("invalid JSON body - empty", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("hello"),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidBodyError("must be a generic object, received null"),
    );
  });

  test("invalid JSON body - text", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("hello").pipe(ClientRequest.textBody("value")),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidBodyError("invalid JSON"),
    );
  });

  test("invalid JSON body - incorrect schema", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("hello").pipe(
        ClientRequest.unsafeJsonBody({ foo: 1 }),
      ),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidBodyError("foo must be string, received 1"),
    );
  });

  test("invalid header", async () => {
    const response = await testRoute(
      exampleRouteRequestHeaders,
      ClientRequest.post("hello"),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidHeadersError("x-header is missing"),
    );
  });

  test("invalid param", async () => {
    const response = await testRoute(
      exampleRouteParams,
      ClientRequest.post("hello/c"),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidParamsError('value must be "a" or "b", received "c"'),
    );
  });

  test("invalid response", async () => {
    const exampleRouteInvalid = exampleApiParams.pipe(
      Route.make("hello", () => Effect.succeed(1 as unknown as string)),
    );

    const response = await testRoute(
      exampleRouteInvalid,
      ClientRequest.post("hello/a"),
    );

    expect(response.status).toEqual(500);
    expect(await Effect.runPromise(response.json)).toEqual(
      ServerError.invalidResponseError("must be string, received 1"),
    );
  });
});
