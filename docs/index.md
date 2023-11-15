---
title: Introduction
permalink: /
nav_order: 1
has_children: false
has_toc: false
---

# effect-http

![download badge](https://img.shields.io/npm/dm/effect-http.svg)

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

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get("getUser", "/user", {
    response: User,
    request: {
      query: GetUserQuery,
    },
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

Now, we can generate an object providing the HTTP client interface using `Http.client`.

```typescript
const client = Client.client(api, {
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

They are specified in the input schemas object (3rd argument of `Http.get`, `Http.post`, ...).

#### Example

```typescript
import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api } from "effect-http";

export const api = pipe(
  Api.api({ title: "My api" }),
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

export const api = pipe(
  Api.api({ title: "My api" }),
  Api.get("stuff", "/stuff/:param/:another?", {
    response: Schema.struct({ value: Schema.number }),
    request: {
      params: Schema.struct({
        param: Schema.string,
        another: Schema.optional(Schema.string),
      }),
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
consequence of the fact that HTTP headers are case-insensitive and internally `effect-http`
converts all header names to lower-case to simplify integration with the underlying
http library - [express](https://github.com/expressjs/express).

Don't worry, this is also encoded into the type information and if you were to
implement the handler, both autocompletion and type-checking would hint the
lower-cased form of the header name.

```typescript
type Api = typeof api;

const handleHello = ({
  headers: { "x-client-id": clientId },
}: Http.Input<Api, "hello">) => Effect.succeed("all good");
```

Take a look at [examples/headers.ts](examples/headers.ts) to see a complete example
API implementation with in-memory rate-limiting and client identification using headers.

### Responses

Response can be specified using a `Schema.Schema<I, O>` which automatically
returns status code 200 and includes only default headers.

If you want a response with custom headers and status code, use the full response
schema instead. The following example will enforce (both for types and runtime)
that returned status, content and headers conform the specified response.

```ts
const api = pipe(
  Http.api(),
  Http.post("hello", "/hello", {
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
        headers: { "My-Header": Schema.string },
      },
      {
        status: 204,
        headers: { "X-Another": Schema.NumberFromString },
      },

```
