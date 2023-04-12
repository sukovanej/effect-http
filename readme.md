# effect-http

High-level declarative HTTP API for effect-ts.

- In-code API specification using `Http.api`.
- Automatic type-safe client derivation using `Http.client`!
- Server-side type-safe implementation with automatic OpenAPI derivation.
- (TBD) Example server derivation.

**Under development**

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

Use the API using auto-generated client code.

```typescript
const client = pipe(api, Http.client(new URL("http://localhost:3000")));

pipe(
);
```

And spawn the server on port 3000 and call it using our `client`.

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

## TODO

- generate dummy / example http
- generate dummy / example client
- testing http
- make sure single operationId can't be used multiple times
