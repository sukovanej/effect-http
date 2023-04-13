# effect-http

High-level declarative HTTP API for [effect-ts](https://github.com/Effect-TS).

## Features

- **Client derivation**. Write the api specification once, get the type-safe client with runtime validation for free.
- **OpenApi derivation**. OpenApi schema with exposed OpenApi UI out of box.
- **Batteries included server implementation**. Automatic runtime validation of input and response objects.
- **Example server derivation**. Expose HTTP server conforming the API specification.
- (TBD) **Mock client derivation**. Test safely against a specified API.

**Under development**

- [Quickstart](#quickstart)
- [Example server](#example-server)
- [Grouping endpoints](#grouping-endpoints)
- [Cookbook](#cookbook)
  - [Handler input type derivation](#handler-input-type-derivation)

## Quickstart

Install using

```bash
pnpm add effect-http
```

`@effect/data`, `@effect/io` and `@effect/schema` are peer-dependencies, install them using

```bash
pnpm add @effect/data @effect/io @effect/schema
```

Bootstrap a simple API specification.

```typescript
import * as Http from "effect-schema";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "effect-http"

const responseSchema = S.struct({ name: S.string });
const querySchema = S.struct({ id: S.number });

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.get("getUser", "/user", {
    response: responseSchema,
    query: querySchema,
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
pipe(
  server,
  Http.listen(3000),
  Effect.flatMap(() => client.getUser({ query: { id: 12 } })),
  Effect.flatMap((user) => Effect.logInfo(`Got ${user.name}, nice!`)),
  Effect.runPromise,
);
```

Also, check the auto-generated OpenAPI UI running on
[localhost:3000/docs](http://localhost:3000/docs/). How awesome is that!

![open api ui](assets/example-openapi-ui.png)

### Example server

`effect-http` has an ability to generate an example server
implementation based on the `Api` specification. This can be
helpful in the following and probably many more cases.

- You're in a process of designing an API and you want to have an
  OpenApi and UI you have a discuss over.
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
import * as S from "@effect/schema/Schema";

const responseSchema = S.struct({ name: S.string });

const api = pipe(
  Http.api(),
  Http.get("test", "/test", { response: responseSchema }),
);

pipe(
  api,
  Http.exampleServer,
  Http.listen(3000),
  Effect.runPromise,
);
```

Go to [localhost:3000/docs](http://localhost:3000/docs) and try calling
endpoints. The exposed HTTP service conforms the specified `Api` specification
and will return only valid example responses.

### Grouping endpoints

To create a new group of endpoints, use `Http.apiGroup("group name")`. This combinator
initializes new `ApiGroup` object. You can pipe it with combinators like `Http.get`,
`Http.post`, etc, as if were defining the `Api`. Api groups can be combined into an
`Api` using a `Http.addGroup` combinator which merges endpoints from the group
into the api in the type-safe manner while preserving group names for each endpoint.

This enables separability of concers for big APIs and provides information for
generation of tags for the OpenApi specification.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

const responseSchema = S.struct({ name: S.string });

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

pipe(
  api,
  Http.exampleServer,
  Http.listen(3000),
  Effect.runPromise,
);
```

The OpenApi UI groups endpoints using the specified groups.

![example-generated-open-api-ui](assets/exmple-server-open-api.png)

## Cookbook

### Handler input type derivation

In non-trivial applications, it is expected the `Server` specification
and handlers are separated. If we define schemas purely for the purpose
of defining the `Api` we'd be forced to derive their type definitions
only for the type-safety of `Server` handlers. Instead, `Http` provides
the `Input` type helper which accepts a type of the `Api` and operation
id type and produces type covering query, params and body schema type.

```typescript
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "effect-http";

const api = pipe(
  Http.api(),
  Http.get("stuff", "/stuff", {
    response: S.string,
    query: S.struct({ value: S.string }),
  }),
);

// NOTICE: the input type gets correctly derived
const handleStuff = ({ query }: Http.Input<typeof api, "stuff">) =>
  Effect.succeed("test");

const server = pipe(
  api,
  Http.server("My api"),
  Http.handle("stuff", handleStuff),
  Http.exhaustive,
);
```
