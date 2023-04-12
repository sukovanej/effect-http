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
  Http.api(),
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
  Http.server("Users API"),
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
