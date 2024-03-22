import * as it from "@effect/vitest"
import { Effect } from "effect"
import { ExampleServer, RouterBuilder } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect } from "vitest"
import { exampleApiFullResponse, exampleApiGet } from "./examples.js"

it.scoped(
  "example server",
  Effect.gen(function*(_) {
    const app = ExampleServer.make(exampleApiGet)

    const response = yield* _(
      NodeTesting.make(RouterBuilder.build(app), exampleApiGet),
      Effect.flatMap((client) => client.getValue({}))
    )

    expect(typeof response).toEqual("number")
  })
)

it.scoped(
  "handle",
  Effect.gen(function*(_) {
    const app = RouterBuilder.make(exampleApiFullResponse).pipe(
      RouterBuilder.handle("another", () => Effect.succeed(69)),
      ExampleServer.handle("hello")
    )

    const response = yield* _(
      NodeTesting.make(RouterBuilder.build(app), exampleApiFullResponse),
      Effect.flatMap((client) => client.hello({}))
    )

    expect(response.status).toEqual(200)
    expect(typeof response.body).toEqual("number")
    expect(typeof response.headers["my-header"]).toEqual("string")
  })
)

it.scoped(
  "handleRemaining",
  Effect.gen(function*(_) {
    const app = RouterBuilder.make(exampleApiFullResponse).pipe(
      RouterBuilder.handle("another", () => Effect.succeed(69)),
      ExampleServer.handleRemaining
    )

    const response = yield* _(
      NodeTesting.make(RouterBuilder.build(app), exampleApiFullResponse),
      Effect.flatMap((client) => client.hello({}))
    )

    expect(response.status).toEqual(200)
    expect(typeof response.body).toEqual("number")
    expect(typeof response.headers["my-header"]).toEqual("string")
  })
)
