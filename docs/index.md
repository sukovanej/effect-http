---
title: Introduction
permalink: /
nav_order: 1
has_children: false
has_toc: false
---

High-level declarative HTTP API for [effect-ts](https://github.com/Effect-TS).

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
- [Headers](#headers)
- [Logging](#logging)
- [Error handling](#error-handling)
  - [Reporting errors in handlers](#reporting-errors-in-handlers)
  - [Example API with conflict API error](#example-api-with-conflict-api-error)
- [Grouping endpoints](#grouping-endpoints)
- [Incremental adoption into existing express app](#incremental-adoption-into-existing-express-app)
- [Cookbook](#cookbook)
  - [Handler input type derivation](#handler-input-type-derivation)
- [API on the client side](#api-on-the-client-side)
  - [Example server](#example-server)
  - [Mock client](#mock-client)
    - [Common headers](#common-headers)
- [Compatibility](#compatibility)

Install using

```bash
pnpm add effect-http
```

Bootstrap a simple API specification.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const responseSchema = Schema.struct({ name: Schema.string });
const query = { id: Schema.number };

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.get("getUser", "/user", {
    response: responseSchema,
    query: query,
  }),
);
```

Create the server implementation.

```typescript
const server = pipe(
  api,
  Http.server,
  Http.handle("getUser", ({ query }) => Effect.succeed({ name: "milan" })),
  Http.exhaustive,
);
```

Now, we can generate an object providing the HTTP client interface using `Http.client`.

```typescript
const client = pipe(api, Http.client(new URL("http://localhost:3000")));
```

And spawn the server on port 3000 and call it using the `client`.

```typescript
const callServer = () =>
  pipe(
    client.getUser({ query: { id: 12 } }),
    Effect.flatMap((user) => Effect.logInfo(`Got ${user.name}, nice!`)),
  );

pipe(
  server,
  Http.listen({ port: 3000, onStart: callServer }),
  Effect.runPromise,
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

They are specified in the input schemas object (3rd argument of `Http.get`, `Http.post`, ...).

#### Example

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

export const api = pipe(
  Http.api({ title: "My api" }),
  Http.get("stuff", "/stuff/:param", {
    response: Schema.struct({ value: Schema.number }),
    body: Schema.struct({ bodyField: Schema.array(Schema.string) }),
    query: { query: Schema.string },
    params: { param: Schema.string },
  }),
);
```

_(This is a complete standalone code example)_

### Headers

Request headers are part of input schemas along with the request body or query parameters.
Their schema is specified similarly to query parameters and path parameters, i.e. using
a mapping from header names onto their schemas. The example below shows an API with
a single endpoint `/hello` which expects a header `X-Client-Id` to be present.

```typescript
import * as Http from "effect-http";

import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api(),
  Http.get("hello", "/hello", {
    response: Schema.string,
    headers: { "X-Client-Id": Schema.string },
  }),
);
```

_(This is a complete standalone code example)_

Server implementation deals with the validation the usual way. For example, if we try
to call the endpoint without the header we will get the following error response.

```json
{ "error": "InvalidHeadersError", "details": "x-client-id is missing" }
```

And as usual, the information about headers will be reflected in the generated
OpenAPI UI.

![example-headers-openapi-ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-headers-openapi-ui.png)

**Important note**. You might have noticed the `details` field of the error response
describes the missing header using lower-case. This is not an error but rather a
consequence of the fact that HTTP headers are case-insensitive and internally `effect-http`
converts all header names to lower-case to simplify integration with the underlying
http library - [express](https://github.com/expressjs/express).

Don't worry, this is also encoded into the type information and if you were to
implement the handler, both autocompletion and type-checking would hint the
lower-cased form of the header name.

```typescript
const handleHello = ({
  headers: { "x-client-id": clientId },
}: Http.Input<typeof api, "hello">) => Effect.succeed("all good");
```

Take a look at [examples/headers.ts](examples/headers.ts) to see a complete example
API implementation with in-memory rate-limiting and client identification using headers.

### Logging

While you can deal with logging directly using Effect (see
[Effect logging](https://effect-ts.github.io/io/modules/Effect.ts.html#logging)
and [Logger module](https://effect-ts.github.io/io/modules/Logger.ts.html)),
there are shorthands for setting up logger through options of `Http.express`
and `Http.listen` functions. The `logger` field's allowed values are

- `"json"` - `effect-log` json logger
- `"pretty"` - `effect-log` pretty logger
- `"default"` - `@effect/io` default logger
- `"none"` - `@effect/io` none logger - to disable logs

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

const api = pipe(Http.api());
const server = pipe(api, Http.server, Http.listen({ logger: "json" }));

Effect.runPromise(server);
```

_(This is a complete standalone code example)_

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

- 400 `Http.invalidQueryError` - _query parameters validation failed_
- 400 `Http.invalidParamsError` - _path parameters validation failed_
- 400 `Http.invalidBodyError` - _request body validation failed_
- 400 `Http.invalidHeadersError` - _request headers validation failed_
- 401 `Http.unauthorizedError` - _invalid authentication credentials_
- 403 `Http.forbiddenError` - _authorization failure_
- 404 `Http.notFoundError` - _cannot find the requested resource_
- 409 `Http.conflictError` - _request conflicts with the current state of the server_
- 415 `Http.unsupportedMediaTypeError` - _unsupported payload format_
- 429 `Http.tooManyRequestsError` - _the user has sent too many requests in a given amount of time_

##### 5xx

- 500 `Http.invalidResponseError` - _internal server error because of response validation failure_
- 500 `Http.internalServerError` - _internal server error_
- 501 `Http.notImplementedError` - _functionality to fulfill the request is not supported_
- 502 `Http.badGatewayError` - _invalid response from the upstream server_
- 503 `Http.serviceunavailableError` - _server is not ready to handle the request_
- 504 `Http.gatewayTimeoutError` - _request timeout from the upstream server_

Using these errors, `Server` runtime can generate human-readable details
in HTTP responses and logs. Also, it can correctly decide what status code
should be returned to the client.

The formatting of `details` field of the error JSON object is abstracted using
[Http.ValidationErrorFormatter](src/Server/ValidationErrorFormatter.ts). The
`ValidationErrorFormatter` is a function taking a `Schema.ParseError` and returning
its string representation. It can be overridden using layers. The following example
will perform a direct JSON serialization of the `Schema.ParserError` to construct
the error details.

```typescript
const myValidationErrorFormatter: Http.ValidationErrorFormatter = (error) =>
  JSON.stringify(error);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideSomeLayer(
    Http.setValidationErrorFormatter(myValidationErrorFormatter),
  ),
  Effect.runPromise,
);
```

#### Example API with conflict API error

Let's see it in action and implement the mentioned user management API. The
API will look as follows.

```typescript
import * as Http from "effect-http";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.post("storeUser", "/users", {
    response: Schema.string,
    body: Schema.struct({ name: Schema.string }),
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

const UserRepositoryService = Context.Tag<UserRepository>();

const mockUserRepository = {
  existsByName: () => Effect.succeed(true),
  store: () => Effect.unit(),
} satisfies UserRepository;
```

And finally, we have the actual `Server` implementation.

```typescript
const handleStoreUser = ({ body }: Http.Input<typeof api, "storeUser">) =>
  pipe(
    Effect.flatMap(UserRepositoryService, (userRepository) =>
      userRepository.existsByName(body.name),
    ),
    Effect.filterOrFail(
      (alreadyExists) => !alreadyExists,
      () => Http.conflictError(`User "${body.name}" already exists.`),
    ),
    Effect.flatMap(() =>
      Effect.flatMap(UserRepositoryService, (repository) =>
        repository.store(body.name),
      ),
    ),
    Effect.map(() => `User "${body.name}" stored.`),
  );

const server = pipe(
  api,
  Http.server,
  Http.handle("storeUser", handleStoreUser),
  Http.exhaustive,
);
```

To run the server, we will start the server using `Http.listen` and provide
the `mockUserRepository` service.

```typescript
pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideService(UserRepositoryService, mockUserRepository),
  Effect.runPromise,
);
```

Try to run the server and call the `POST /user`.

_Server_

```bash
$ pnpm tsx examples/conflict-error-example.ts

16:53:55 (Fiber #0) INFO  Server listening on :::3000
16:54:14 (Fiber #8) WARN  POST /users failed
ᐉ { "errorTag": "ConflictError", "error": "User "milan" already exists." }
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

{
    "details": "User \"patrik\" already exists.",
    "error": "ConflictError"
}
```

### Grouping endpoints

To create a new group of endpoints, use `Http.apiGroup("group name")`. This combinator
initializes new `ApiGroup` object. You can pipe it with combinators like `Http.get`,
`Http.post`, etc, as if were defining the `Api`. Api groups can be combined into an
`Api` using a `Http.addGroup` combinator which merges endpoints from the group
into the api in the type-safe manner while preserving group names for each endpoint.

This enables separability of concers for big APIs and provides information for
generation of tags for the OpenAPI specification.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const responseSchema = Schema.struct({ name: Schema.string });

const testApi = pipe(
  Http.apiGroup("test"),
  Http.get("test", "/test", { response: responseSchema }),
);

const userApi = pipe(
  Http.apiGroup("Users"),
  Http.get("getUser", "/user", { response: responseSchema }),
  Http.post("storeUser", "/user", { response: responseSchema }),
  Http.put("updateUser", "/user", { response: responseSchema }),
  Http.delete("deleteUser", "/user", { response: responseSchema }),
);

const categoriesApi = pipe(
  Http.apiGroup("Categories"),
  Http.get("getCategory", "/category", { response: responseSchema }),
  Http.post("storeCategory", "/category", { response: responseSchema }),
  Http.put("updateCategory", "/category", { response: responseSchema }),
  Http.delete("deleteCategory", "/category", { response: responseSchema }),
);

const api = pipe(
  Http.api(),
  Http.addGroup(testApi),
  Http.addGroup(userApi),
  Http.addGroup(categoriesApi),
);

pipe(api, Http.exampleServer, Http.listen({ port: 3000 }), Effect.runPromise);
```

_(This is a complete standalone code example)_

The OpenAPI UI will group endpoints according to the `api` and show
corresponding titles for each group.

![example-generated-open-api-ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-server-openapi-ui.png)

## Incremental adoption into existing express app

In `effect-http`, calling `Http.listen` under the hood performs the conversion of a
`Server` onto an `Express` app and then it immediately triggers `listen()` on the
generated app. This is very convenient because in the userland, you deal with the
app creation using `Effect` and don't need to care about details of the underlying
Express web framework.

This hiding might get in a way if you decide to adopt `effect-http` into an
existing application. Because of that, the Express app derivation is exposed
as a public API of the `effect-http`. The exposed function is `Http.express`
and it takes a configuration options and `Server` object (it's curried) as
inputs and returns the generated `Express` app.

As the [Express documentation](https://expressjs.com/en/guide/using-middleware.html)
describes, _an Express application is essentially a series of middleware function calls_.
This is perfect because if we decide to integrate an effect api into an express app,
we can do so by simply plugging the generated app as an application-level middleware
into the express app already in place.

Let's see it in action. Suppose we have the following existing express application.

```typescript
import express from "express";

const legacyApp = express();

legacyApp.get("/legacy-endpoint", (_, res) => {
  res.json({ hello: "world" });
});

app.listen(3000, () => console.log("Listening on 3000"));
```

Now, we'll create an `effect-http` api and server.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

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
```

In order to _merge_ these two applications, we use the aforementioned
`Http.express` function to convert the `server` into an Express app.
We'll receive the `Express` app in the success rail of the `Effect`
so we can map over it and attach the legacy app there. To start
the application, use `Http.listenExpress()` which has the same
signature as `Http.listen` but instead of `Http.Server` it takes
an `Express` instance.

```typescript
pipe(
  server,
  Http.express({ openapiPath: "/docs-new" }),
  Effect.map((app) => {
    app.use(legacyApp);
    return app;
  }),
  Effect.flatMap(Http.listenExpress()),
  Effect.runPromise,
);
```

There are some caveats we should be aware of. Middlewares and express in general
are imperative. Middlewares that execute first can end the request-response
cycle. Also, the `Server` doesn't have any information about the legacy express
application and the validation, logging and OpenAPI applies only for its
routes. That's why this approach should be generally considered a transition
state. It's in place mainly to allow an incremental rewrite.

If you already manage an OpenAPI in the express app, you can use the
options of `Http.express` to either disable the generated OpenAPI completely
or expose it through a different endpoint.

```typescript
// Disable the generated OpenAPI
Http.express({ openapiEnabled: false });

// Or, expose the new OpenAPI within a different route
Http.express({ openapiPath: "/docs-new" });
```

[See the full example](examples/incremental-adoption-express.ts)

## Cookbook

### Handler input type derivation

In non-trivial applications, it is expected the `Server` specification
and handlers are separated. If we define schemas purely for the purpose
of defining the `Api` we'd be forced to derive their type definitions
only for the type-safety of `Server` handlers. Instead, `Http` provides
the `Input` type helper which accepts a type of the `Api` and operation
id type and produces type covering query, params and body schema type.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api({ title: "My api" }),
  Http.get("stuff", "/stuff", {
    response: Schema.string,
    query: { value: Schema.string },
  }),
);

// Notice query has type { readonly value: string; }
const handleStuff = ({ query }: Http.Input<typeof api, "stuff">) =>
  pipe(
    Effect.fail(Http.notFoundError("I didnt find it")),
    Effect.tap(() => Effect.log(`Received ${query.value}`)),
  );

const server = pipe(
  api,
  Http.server,
  Http.handle("stuff", handleStuff),
  Http.exhaustive,
);

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
```

_(This is a complete standalone code example)_

## API on the client side

While `effect-http` is intended to be primarly used on the server-side, i.e.
by developers providing the HTTP service, it is possible to use it also to
model, use and test against someone else's API. Out of box, you can make
us of the following combinators.

- `Http.client` - client for the real integration with the API.
- `Http.mockClient` - client for testing against the API interface.
- `Http.exampleServer` - server implementation derivation with example responses.

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

Use `Http.exampleServer` combinator to generate a `Server` from `Api`.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const responseSchema = Schema.struct({ name: Schema.string });

const api = pipe(
  Http.api(),
  Http.get("test", "/test", { response: responseSchema }),
);

pipe(api, Http.exampleServer, Http.listen({ port: 3000 }), Effect.runPromise);
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
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api(),
  Http.get("getValue", "/get-value", { response: Schema.number }),
);
```

In a real environment, we will probably use the derived client
using `Http.client`. But for tests, we probably want a dummy
client which will return values conforming the API. For such
a use-case, we can derive a mock client.

```typescript
const client = pipe(api, Http.mockClient());
```

Calling `getValue` on the client will perform the same client-side
validation as would be done by the real client. But it will return
an example response instead of calling the API. It is also possible
to enforce the value to be returned in a type-safe manner
using the option argument. The following client will always
return number `12` when calling the `getValue` operation.

```typescript
const client = pipe(api, Http.mockClient({ responses: { getValue: 12 } }));
```

#### Common headers

On the client side, headers that have the same value for all request calls
(for example `USER-AGENT`) can be configured during a client creation. Such
headers can be completely omitted when an operation requiring these headers
is called. Common headers can be overriden during operation call.

Note that configuring common headers doesn't make them available
for all requests. Common header will be applied only if the given
endpoint declares it in its schema.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api(),
  Http.get("test", "/test", {
    response: Schema.struct({ name: Schema.string }),
    headers: { AUTHORIZATION: Schema.string },
  }),
);

const client = pipe(
  api,
  Http.client(new URL("http://my-url"), {
    headers: {
      authorization: "Basic aGVsbG8gcGF0cmlrLCBob3cgYXJlIHlvdSB0b2RheQ==",
    },
  }),
);

// "x-my-header" can be provided to override the default but it's not necessary
pipe(client.test(), Effect.runPromise);
```

_(This is a complete standalone code example)_

## Compatibility

This library is tested against

- nodejs 18.14.0
- nodejs 19.8.1
- nodejs 20.0.0
