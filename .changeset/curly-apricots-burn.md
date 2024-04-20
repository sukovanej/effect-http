---
"effect-http-node": minor
"effect-http": minor
---

Add support for standalone handlers to allow an extraction of the handler logic.

```ts
const myEndpointHandler = RouterBuilder.handler(api, "myEndpoint", ({ query }) =>
  Effect.succeed(query.country))

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle(myEndpointHandler),
  RouterBuilder.build
)
```
