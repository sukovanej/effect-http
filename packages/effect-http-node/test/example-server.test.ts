import { Effect, pipe } from "effect"
import { ExampleServer, RouterBuilder } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect, test } from "vitest"
import { exampleApiFullResponse, exampleApiGet } from "./examples.js"
import { runTestEffect } from "./utils.js"

test("example server", async () => {
  const app = ExampleServer.make(exampleApiGet)

  await pipe(
    NodeTesting.make(RouterBuilder.build(app), exampleApiGet),
    Effect.flatMap((client) => client.getValue({})),
    Effect.map((response) => {
      expect(typeof response).toEqual("number")
    }),
    runTestEffect
  )
})

test("handle", async () => {
  const app = RouterBuilder.make(exampleApiFullResponse).pipe(
    RouterBuilder.handle("another", () => Effect.succeed(69)),
    ExampleServer.handle("hello")
  )

  const response = await pipe(
    NodeTesting.make(RouterBuilder.build(app), exampleApiFullResponse),
    Effect.flatMap((client) => client.hello({})),
    runTestEffect
  )

  expect(response.status).toEqual(200)
  expect(typeof response.body).toEqual("number")
  expect(typeof response.headers["my-header"]).toEqual("string")
})

test("handleRemaining", async () => {
  const app = RouterBuilder.make(exampleApiFullResponse).pipe(
    RouterBuilder.handle("another", () => Effect.succeed(69)),
    ExampleServer.handleRemaining
  )

  const response = await pipe(
    NodeTesting.make(RouterBuilder.build(app), exampleApiFullResponse),
    Effect.flatMap((client) => client.hello({})),
    runTestEffect
  )

  expect(response.status).toEqual(200)
  expect(typeof response.body).toEqual("number")
  expect(typeof response.headers["my-header"]).toEqual("string")
})
