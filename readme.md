# effect-http

High-level declarative HTTP API for effect-ts.

- In-code API specification using `Http.api`.
- Type-safe client derivation using `Http.client`!
- Type-safe server-side implementation with automatic OpenAPI derivation.
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

## TODO

- [ ] generate dummy / example http
- [ ] generate dummy / example client
- [ ] testing http (generate always failing / always succeeding client)
- [ ] make sure single operationId can't be used multiple times
- [ ] OpenAPI groups
