import { createServer } from "http";

import * as Server from "@effect/platform-node/Http/Server";
import * as Client from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as HttpServer from "@effect/platform/HttpServer";
import { Effect, Layer, Option, pipe } from "effect";
import {
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
} from "effect-http";
import * as Route from "effect-http/Route";
import { apply } from "effect/Function";

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

const serverUrl = Effect.flatMap(Server.Server, (server) => {
  const address = server.address;

  if (address._tag === "UnixAddress") {
    return Effect.die("Unexpected UnixAddress");
  }

  return Effect.succeed(new URL(`http://localhost:${address.port}`));
});

const client = Effect.gen(function* (_) {
  const defaultClient = yield* _(Client.Client);
  const url = yield* _(serverUrl);

  return defaultClient.pipe(
    Client.mapRequest(ClientRequest.prependUrl(url.toString())),
  );
});

const testRoute = <E1>(
  route: HttpServer.router.Route<never, E1>,
  request: ClientRequest.ClientRequest,
) =>
  testRouter(HttpServer.router.fromIterable([route]), request).pipe(
    Effect.runPromise,
  );

const testRouter = <E1>(
  router: HttpServer.router.Router<never, E1>,
  request: ClientRequest.ClientRequest,
) => {
  const ServerLive = pipe(
    Server.layer(() => createServer(), {
      port: undefined,
    }),
    Layer.merge(Client.layer),
  );

  const serve = Server.serve(router).pipe(Effect.scoped);
  const runTest = Effect.flatMap(client, apply(request));

  return serve.pipe(
    Effect.tapErrorCause(Effect.logError),
    Effect.scoped,
    Effect.fork,
    Effect.flatMap((fiber) =>
      Effect.acquireRelease(
        runTest.pipe(Effect.tapErrorCause(Effect.logError)),
        () => Effect.interruptWith(fiber.id()).pipe(Effect.ignoreLogged),
      ),
    ),
    Effect.provide(ServerLive),
    Effect.scoped,
  );
};

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
      invalidQueryError("country is missing"),
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
      invalidQueryError(
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
      invalidBodyError("must be a generic object, received null"),
    );
  });

  test("invalid JSON body - text", async () => {
    const response = await testRoute(
      exampleRouteRequestBody,
      ClientRequest.post("hello").pipe(ClientRequest.textBody("value")),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      invalidBodyError("invalid JSON"),
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
      invalidBodyError("foo must be string, received 1"),
    );
  });

  test("invalid header", async () => {
    const response = await testRoute(
      exampleRouteRequestHeaders,
      ClientRequest.post("hello"),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      invalidHeadersError("x-header is missing"),
    );
  });

  test("invalid param", async () => {
    const response = await testRoute(
      exampleRouteParams,
      ClientRequest.post("hello/c"),
    );

    expect(response.status).toEqual(400);
    expect(await Effect.runPromise(response.json)).toEqual(
      invalidParamsError('value must be "a" or "b", received "c"'),
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
      invalidResponseError("must be string, received 1"),
    );
  });
});
