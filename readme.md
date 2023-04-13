# effect-http

High-level declarative HTTP API for effect-ts.

- In-code API specification using `Http.api`.
- Type-safe client derivation using `Http.client`!
- Type-safe server-side implementation with automatic OpenAPI derivation.
- (TBD) Example server derivation.

**Under development**

- [Quickstart](#Quickstart)
- [Cookbook](#Cookbook)
  - [Handler input type derivation](#Handler-input-type-derivation)

## Quickstart

Install using

```bash
pnpm add effect-http @effect/data @effect/io @effect/schema
```

Bootstrap a simple application API.

```typescript
import * as Http from "effect-schema";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

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
  Effect.flatMap((port) => Effect.logInfo(`Listening on ${port}`)),
  Effect.flatMap(() => client.getUser({ query: { id: 12 } })),
  Effect.flatMap((user) => Effect.logInfo(`Got ${user.name}, nice!`)),
  Effect.runPromise,
);
```

Also, let's check the auto-generated OpenAPI UI running on
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
  Effect.flatMap(({ port }) => Effect.log(`Listening on ${port}`)),
  Effect.runPromise,
);
```

Go to [localhost:3000/docs](http://localhost:3000/docs) and try calling
endpoints. The exposed HTTP service conforms the specified `Api` specification
and will return only valid example responses.

### Grouping endpoints

It is possible to group endpoints using the `Http.group` combinator.
Right now, the only purpose of this information is to be able to
generate tags for the OpenApi specification.

```typescript
import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

const responseSchema = S.struct({ name: S.string });

const api = pipe(
  Http.api({ groupName: "Test" }),
  Http.get("test", "/test", { response: responseSchema }),
  Http.group("Users"),
  Http.get("getUser", "/user", { response: responseSchema }),
  Http.post("storeUser", "/user", { response: responseSchema }),
  Http.put("updateUser", "/user", { response: responseSchema }),
  Http.delete("deleteUser", "/user", { response: responseSchema }),
  Http.group("Categories"),
  Http.get("getCategory", "/category", { response: responseSchema }),
  Http.post("storeCategory", "/category", { response: responseSchema }),
  Http.put("updateCategory", "/category", { response: responseSchema }),
  Http.delete("deleteCategory", "/category", { response: responseSchema }),
);

pipe(
  api,
  Http.exampleServer,
  Http.listen(3000),
  Effect.flatMap(({ port }) => Effect.log(`Listening on ${port}`)),
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

import * as Http from "../src";

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

## TODO

- [ ] generate dummy / example http
- [ ] generate dummy / example client
- [ ] testing http (generate always failing / always succeeding client)
- [ ] make sure single operationId can't be used multiple times
- [ ] OpenAPI groups
