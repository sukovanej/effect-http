---
title: Introduction
permalink: /
nav_order: 1
has_children: false
has_toc: false
---

# effect-http

![download badge](https://img.shields.io/npm/dm/effect-http.svg)

High-level declarative HTTP library for [Effect-TS](https://github.com/Effect-TS) built on top of
[@effect/platform](https://github.com/effect-ts/platform).

- :star: **Client derivation**. Write the api specification once, get the type-safe client with runtime validation for free.
- :rainbow: **OpenAPI derivation**. `/docs` endpoint with OpenAPI UI out of box.
- :battery: **Batteries included server implementation**. Automatic runtime request and response validation.
- :crystal_ball: **Example server derivation**. Automatic derivation of example server implementation.
- :bug: **Mock client derivation**. Test safely against a specified API.

**Under development.** Please note that currently any release might introduce
breaking changes and the internals and the public API are still evolving and changing.

## Quickstart

- [Quickstart](#quickstart)
- [Request validation](#request-validation)
  - [Example](#example)
  - [Optional path parameters](#optional-path-parameters)
- [Headers](#headers)
- [Responses](#responses)
- [Testing the server](#testing-the-server)
- [Error handling](#error-handling)
  - [Reporting errors in handlers](#reporting-errors-in-handlers)
  - [Example API with conflict API error](#example-api-with-conflict-api-error)
- [Grouping endpoints](#grouping-endpoints)
- [Descriptions in OpenApi](#descriptions-in-openapi)
- [API on the client side](#api-on-the-client-side)
  - [Example server](#example-server)
  - [Mock client](#mock-client)
  - [Common headers](#common-headers)
- [Compatibility](#compatibility)

Install together with `effect` using

```bash
pnpm add effect effect-http @effect/platform-node
```

Bootstrap a simple API specification.

```typescript
import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, Client, NodeServer, RouterBuilder } from "effect-http";

const User = Schema.struct({
  name: Schema.string,
  id: pipe(Schema.number, Schema.int(), Schema.positive()),
});
const GetUserQuery = Schema.struct({ id: Schema.NumberFromString });

const api = Api.api({ title: "Users API" }).pipe(
  Api.get("getUser", "/user", {
    response: User,
    request: { query: GetUserQuery },
  }),
);
```

Create the app implementation.

```typescript
const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) =>
    Effect.succeed({ name: "milan", id: query.id }),
  ),
  RouterBuilder.build,
);
```

Now, we can generate an object providing the HTTP client interface using `Client.make`.

```typescript
const client = Client.make(api, {
  baseUrl: new URL("http://localhost:3000"),
});
```

Spawn the server on port 3000,

```typescript
app.pipe(NodeServer.listen({ port: 3000 }), runMain);
```

and call it using the `client`.

```ts
const callServer = pipe(
  client.getUser({ query: { id: 12 } }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
);
```

Also, check the auto-generated OpenAPI UI running on
[localhost:3000/docs](http://localhost:3000/docs/). How awesome is that!

![open api ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-openapi-ui.png)

### Request validation

Each endpoint can declare expectations on the request format. Specifically,

- `body` - request body
- `query` - query parameters
- `params` - path parameters
- `headers` - request headers

They are specified in the input schemas object (3rd argument of `Api.get`, `Api.post`, ...).

#### Example

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api } from "effect-http";

export const api = Api.api({ title: "My api" }).pipe(
  Api.get("stuff", "/stuff/:param", {
    response: Schema.struct({ value: Schema.number }),
    body: Schema.struct({ bodyField: Schema.array(Schema.string) }),
    query: { query: Schema.string },
    params: { param: Schema.string },
  }),
);
```

_(This is a complete standalone code example)_

#### Optional path parameters

Optional parameter is denoted using a question mark in the path
match pattern. In the request param schema, use `Schema.optional(<schema>)`.

In the following example the last `:another` path parameter can be
ommited on the client side.

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api } from "effect-http";

const Stuff = Schema.struct({ value: Schema.number });
const StuffParams = Schema.struct({
  param: Schema.string,
  another: Schema.optional(Schema.string),
});

export const api = pipe(
  Api.api({ title: "My api" }),
  Api.get("stuff", "/stuff/:param/:another?", {
    response: Stuff,
    request: {
      params: StuffParams,
    },
  }),
);
```

### Headers

Request headers are part of input schemas along with the request body or query parameters.
Their schema is specified similarly to query parameters and path parameters, i.e. using
a mapping from header names onto their schemas. The example below shows an API with
a single endpoint `/hello` which expects a header `X-Client-Id` to be present.

```typescript
import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http";

const api = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: Schema.string,
    request: {
      headers: Schema.struct({ "X-Client-Id": Schema.string }),
    },
  }),
);

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  runMain,
);
```

_(This is a complete standalone code example)_

Server implementation deals with the validation the usual way. For example, if we try
to call the endpoint without the header we will get the following error response.

```json
{
  "error": "Request validation error",
  "location": "headers",
  "message": "x-client-id is missing"
}
```

And as usual, the information about headers will be reflected in the generated
OpenAPI UI.

![example-headers-openapi-ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-headers-openapi-ui.png)

**Important note**. You might have noticed the `details` field of the error response
describes the missing header using lower-case. This is not an error but rather a
consequence of the fact that HTTP headers are case-insensitive.

Don't worry, this is also encoded into the type information and if you were to
implement the handler, both autocompletion and type-checking would hint the
lower-cased form of the header name. Take a look at [examples/headers.ts](examples/headers.ts)
to see a complete example API implementation with in-memory rate-limiting and client
identification using headers.

### Responses

Response can be specified using a `Schema.Schema<I, O>` which automatically
returns status code 200 and includes only default headers.

If you want a response with custom headers and status code, use the full response
schema instead. The following example will enforce (both for types and runtime)
that returned status, content and headers conform the specified response.

```ts
const api = Api.api().pipe(
  Api.post("hello", "/hello", {
    response: {
      status: 200,
      content: Schema.number,
      headers: { "My-Header": Schema.string },
    },
  }),
);
```

It is also possible to specify multiple full response schemas.

```ts
const api = Api.api().pipe(
  Api.post("hello", "/hello", {
    response: [
      {
        status: 201,
        content: Schema.number,
      },
      {
        status: 200,
        content: Schema.number,
        headers: { "My-Header": Schema.string },
      },
      {
        status: 204,
        headers: { "X-Another": Schema.NumberFromString },
      },
    ],
  }),
);
```

The server implemention is type-checked against the api responses
and one of the specified response objects must be returned.

Note: the `status` needs to be `as const` because without it Typescript
will infere the `number` type.

```ts
const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("hello", () =>
    Effect.succeed({
      headers: { "my-header": 12 },
      content: 12,
      status: 200 as const,
    }),
  ),
  RouterBuilder.build,
);
```

### Testing the server

While most of your tests should focus on the functionality independent
of HTTP exposure, it can be beneficial to perform integration or
contract tests for your endpoints. The `Testing` module offers a
`Testing.make` combinator that generates a testing client from
the Server. This derived testing client has a similar interface
to the one derived by `Client.make`.

Now, let's write an example test for the following server.

```ts
const api = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: Schema.string,
  }),
);

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("hello", ({ query }) =>
    Effect.succeed(`${query.input + 1}`),
  ),
  RouterBUilder.build,
);
```

The test might look as follows.

```ts
test("test /hello endpoint", async () => {
  const response = await Testing.make(app, api).pipe(
    Effect.flatMap((client) => client.hello({ query: { input: 12 } })),
    Effect.runPromise,
  );

  expect(response).toEqual("13");
});
```

In comparison to the `Client` we need to run our endpoint handlers
in place. Therefore, in case your server uses DI services, you need to
provide them in the test code. This contract is type safe and you'll be
notified by the type-checker if the `Effect` isn't invoked with all
the required services.

### Error handling

Validation of query parameters, path parameters, body and even responses is
handled for you out of box. By default, failed validation will be reported
to clients in the response body. On the server side, you get warn logs with
the same information.

#### Reporting errors in handlers

On top of the automatic input and output validation, handlers can fail for variety
of different reasons.

Suppose we're creating user management API. When persisting a new user, we want
to guarantee we don't attempt to persist a user with an already taken name.
If the user name check fails, the API should return `409 CONFLICT` error because the client
is attempting to trigger an operatin conflicting with the current state of the server.
For these cases, `effect-http` provides error types and corresponding creational
functions we can use in the error rail of the handler effect.

##### 4xx

- 400 `ServerError.badRequest` - _client make an invalid request_
- 401 `ServerError.unauthorizedError` - _invalid authentication credentials_
- 403 `ServerError.forbiddenError` - _authorization failure_
- 404 `ServerError.notFoundError` - _cannot find the requested resource_
- 409 `ServerError.conflictError` - _request conflicts with the current state of the server_
- 415 `ServerError.unsupportedMediaTypeError` - _unsupported payload format_
- 429 `ServerError.tooManyRequestsError` - _the user has sent too many requests in a given amount of time_

##### 5xx

- 500 `ServerError.internalServerError` - _internal server error_
- 501 `ServerError.notImplementedError` - _functionality to fulfill the request is not supported_
- 502 `ServerError.badGatewayError` - _invalid response from the upstream server_
- 503 `ServerError.serviceunavailableError` - _server is not ready to handle the request_
- 504 `ServerError.gatewayTimeoutError` - _request timeout from the upstream server_

#### Example API with conflict API error

Let's see it in action and implement the mentioned user management API. The
API will look as follows.

```typescript
import { Schema } from "@effect/schema/Schema";
import { Context, Effect, pipe } from "effect";
import { Api, NodeServer, RouterBuilder, ServerError } from "effect-http";

const api = Api.api({ title: "Users API" }).pipe(
  Api.post("storeUser", "/users", {
    response: Schema.string,
    request: {
      body: Schema.struct({ name: Schema.string }),
    },
  }),
);
```

Now, let's implement a `UserRepository` interface abstracting the interaction with
our user storage. I'm also providing a mock implementation which will always return
the user already exists. We will plug the mock user repository into our server
so we can see the failure behavior.

```typescript
interface UserRepository {
  existsByName: (name: string) => Effect.Effect<never, never, boolean>;
  store: (user: string) => Effect.Effect<never, never, void>;
}

const UserRepository = Context.Tag<UserRepository>();

const mockUserRepository = UserRepository.of({
  existsByName: () => Effect.succeed(true),
  store: () => Effect.unit,
});
```

And finally, we have the actual `App` implementation.

```typescript
const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("storeUser", ({ body }) =>
    pipe(
      Effect.flatMap(UserRepository, (userRepository) =>
        userRepository.existsByName(body.name),
      ),
      Effect.filterOrFail(
        (alreadyExists) => !alreadyExists,
        () => ServerError.makeText(409, `User "${body.name}" already exists.`),
      ),
      Effect.flatMap(() =>
        Effect.flatMap(UserRepository, (repository) =>
          repository.store(body.name),
        ),
      ),
      Effect.map(() => `User "${body.name}" stored.`),
    ),
  ),
  RouterBuilder.build,
);
```

To run the server, we will start the server using `NodeServer.listen` and provide
the `mockUserRepository` service.

```typescript
app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provideService(UserRepository, mockUserRepository),
  Effect.runPromise,
);
```

Try to run the server and call the `POST /user`.

_Server_

```bash
$ pnpm tsx examples/conflict-error-example.ts

22:06:00 (Fiber #0) DEBUG Static swagger UI files loaded (1.7MB)
22:06:00 (Fiber #0) INFO  Listening on :::3000
22:06:01 (Fiber #8) WARN  POST /users client error 409
```

_Client_ (using [httpie cli](https://httpie.io/cli))

```bash
$ http localhost:3000/users name="patrik"

HTTP/1.1 409 Conflict
Connection: keep-alive
Content-Length: 68
Content-Type: application/json; charset=utf-8
Date: Sat, 15 Apr 2023 16:36:44 GMT
ETag: W/"44-T++MIpKSqscvfSu9Ed1oobwDDXo"
Keep-Alive: timeout=5
X-Powered-By: Express

User "patrik" already exists.
```

### Grouping endpoints

To create a new group of endpoints, use `Api.apiGroup("group name")`. This combinator
initializes new `ApiGroup` object. You can pipe it with combinators like `Api.get`,
`Api.post`, etc, as if were defining the `Api`. Api groups can be combined into an
`Api` using a `Api.addGroup` combinator which merges endpoints from the group
into the api in the type-safe manner while preserving group names for each endpoint.

This enables separability of concers for big APIs and provides information for
generation of tags for the OpenAPI specification.

```typescript
import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http";

const ExampleResponse = Schema.struct({ name: Schema.string });

const testApi = Api.apiGroup("test").pipe(
  Api.get("test", "/test", { response: ExampleResponse }),
);

const userApi = Api.apiGroup("Users").pipe(
  Api.get("getUser", "/user", { response: ExampleResponse }),
  Api.post("storeUser", "/user", { response: ExampleResponse }),
  Api.put("updateUser", "/user", { response: ExampleResponse }),
  Api.delete("deleteUser", "/user", { response: ExampleResponse }),
);

const categoriesApi = Api.apiGroup("Categories").pipe(
  Api.get("getCategory", "/category", { response: ExampleResponse }),
  Api.post("storeCategory", "/category", { response: ExampleResponse }),
  Api.put("updateCategory", "/category", { response: ExampleResponse }),
  Api.delete("deleteCategory", "/category", { response: ExampleResponse }),
);

const api = Api.api().pipe(
  Api.addGroup(testApi),
  Api.addGroup(userApi),
  Api.addGroup(categoriesApi),
);

ExampleServer.make(api).pipe(
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  runMain,
);
```

_(This is a complete standalone code example)_

The OpenAPI UI will group endpoints according to the `api` and show
corresponding titles for each group.

![example-generated-open-api-ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-server-openapi-ui.png)

## Descriptions in OpenApi

The [schema-openapi](https://github.com/sukovanej/schema-openapi) library which is
used for OpenApi derivation from the `Schema` takes into account
[description](https://effect-ts.github.io/schema/modules/Schema.ts.html#description)
annotations and propagates them into the specification.

Some descriptions are provided from the built-in `@effect/schema/Schema` combinators.
For example, the usage of `Schema.int()` will result in "_a positive number_"
description in the OpenApi schema. One can also add custom description using the
`Schema.description` combinator.

On top of types descriptions which are included in the `schema` field, effect-http
also checks top-level schema descriptions and uses them for the parent object which
uses the schema. In the following example, the "_User_" description for the response
schema is used both as the schema description but also for the response itself. The
same holds for the `id` query paremeter.

For an operation-level description, call the API endpoint method (`Api.get`,
`Api.post` etc) with a 4th argument and set the `description` field to the
desired description.

```ts
import { runMain } from "@effect/platform-node/Runtime";
import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import { Api, NodeServer, RouterBuilder } from "effect-http";

const User = pipe(
  Schema.struct({
    name: Schema.string,
    id: pipe(Schema.number, Schema.int(), Schema.positive()),
  }),
  Schema.description("User"),
);
const GetUserQuery = Schema.struct({
  id: pipe(Schema.NumberFromString, Schema.description("User id")),
});

const api = Api.api({ title: "Users API" }).pipe(
  Api.get(
    "getUser",
    "/user",
    {
      response: User,
      request: {
        query: GetUserQuery,
      },
    },
    { description: "Returns a User by id" },
  ),
);

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("getUser", ({ query }) =>
    Effect.succeed({ name: "mike", id: query.id }),
  ),
  RouterBuilder.build,
);

app.pipe(NodeServer.listen({ port: 3000 }), runMain);
```

## API on the client side

While `effect-http` is intended to be primarly used on the server-side, i.e.
by developers providing the HTTP service, it is possible to use it also to
model, use and test against someone else's API. Out of box, you can make
us of the following combinators.

- `Client` - client for the real integration with the API.
- `MockClient` - client for testing against the API interface.
- `ExampleServer` - server implementation derivation with example responses.

### Example server

`effect-http` has the ability to generate an example server
implementation based on the `Api` specification. This can be
helpful in the following and probably many more cases.

- You're in a process of designing an API and you want to have _something_
  to share with other people and have a discussion over before the actual
  implementation starts.
- You develop a fullstack application with frontend first approach
  you want to test the integration with a backend you haven't
  implemeted yet.
- You integrate a 3rd party HTTP API and you want to have an ability to
  perform integration tests without the need to connect to a real
  running HTTP service.

Use `ExampleServer.make` combinator to generate a `RouterBuilder` from an `Api`.

```typescript
import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http";

const MyResponse = Schema.struct({
  name: Schema.string,
  value: Schema.number,
});

const api = Api.api().pipe(Api.get("test", "/test", { response: MyResponse }));

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  runMain,
);
```

_(This is a complete standalone code example)_

Go to [localhost:3000/docs](http://localhost:3000/docs) and try calling
endpoints. The exposed HTTP service conforms the `api` and will return
only valid example responses.

### Mock client

To performed quick tests against the API interface, `effect-http` has
the ability to generate a mock client which will return example or
specified responses. Suppose we are integrating a hypothetical API
with `/get-value` endpoint returning a number. We can model such
API as follows.

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api } from "effect-http";

const api = Api.api().pipe(
  Api.get("getValue", "/get-value", { response: Schema.number }),
);
```

In a real environment, we will probably use the derived client
using `MockClient.make`. But for tests, we probably want a dummy
client which will return values conforming the API. For such
a use-case, we can derive a mock client.

```typescript
const client = MockClient.make(api);
```

Calling `getValue` on the client will perform the same client-side
validation as would be done by the real client. But it will return
an example response instead of calling the API. It is also possible
to enforce the value to be returned in a type-safe manner
using the option argument. The following client will always
return number `12` when calling the `getValue` operation.

```typescript
const client = MockClient.make(api, { responses: { getValue: 12 } });
```

## Compatibility

This library is tested against nodejs 20.9.0.
