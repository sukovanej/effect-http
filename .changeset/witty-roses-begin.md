---
"effect-http-node": patch
---

Add `NodeTesting.handler`. It accepts a `Handler.Handler<A, E, R>` and produces an instance
of `HttpClient.HttpClient.Default`. It start the server with the handler in a background
and the produced client has base URL pointing to the server. It behaves exactly like the
`NodeTesting.makeRaw`, but it works with handlers instead of `HttpApp.HttpApp` instances.

It provides a convenient way to test handlers in isolation.

```ts
import { HttpClientRequest } from "@effect/platform"
import { Schema } from "@effect/schema"
import { expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { Api, Handler } from "effect-http"
import { NodeTesting } from "effect-http-node"

const myEndpoint = Api.get("myEndpoint", "/my-endpoint").pipe(
  Api.setResponseBody(Schema.Struct({ hello: Schema.String }))
)

const myHandler = Handler.make(myEndpoint, () => Effect.succeed({ hello: "world" }))

it.scoped("myHandler", () =>
  Effect.gen(function*() {
    const client = yield* NodeTesting.handler(myHandler)
    const response = yield* client(HttpClientRequest.get("/my-endpoint"))

    expect(response.status).toEqual(200)
    expect(yield* response.json).toEqual({ hello: "world" })
  }))
```
