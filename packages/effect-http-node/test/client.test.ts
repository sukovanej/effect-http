import { HttpServer } from "@effect/platform"
import { Schema } from "@effect/schema"
import { Cause, Duration, Effect, Exit, Fiber, pipe } from "effect"
import { Api, ClientError, ExampleServer, RouterBuilder } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect, test, vi } from "vitest"
import { exampleApiEmptyResponse, exampleApiGetQueryParameter } from "./examples.js"
import { runTestEffect } from "./utils.js"

test("quickstart example e2e", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("getUser", "/user", {
        response: Schema.struct({ name: Schema.string }),
        request: {
          query: Schema.struct({ id: Schema.NumberFromString })
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: `milan:${query.id}` })),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.getUser({ query: { id: 12 } }))
    )

    expect(response).toEqual({ name: "milan:12" })
  }).pipe(runTestEffect))

test.each(["get", "put", "post", "delete", "options", "patch"] as const)(
  "Dummy call - %s",
  (method) =>
    Effect.gen(function*(_) {
      const responseSchema = Schema.struct({ name: Schema.string })

      const api = pipe(
        Api.api(),
        Api[method]("doStuff", "/stuff", {
          response: responseSchema
        })
      )

      const app = pipe(
        RouterBuilder.make(api),
        RouterBuilder.handle("doStuff", () => Effect.succeed({ name: "milan" })),
        RouterBuilder.build
      )

      const response = yield* _(
        NodeTesting.make(app, api),
        Effect.flatMap((client) => client.doStuff({}))
      )

      expect(response).toEqual({ name: "milan" })
    }).pipe(runTestEffect)
)

test("All input types", () =>
  Effect.gen(function*(_) {
    const responseSchema = Schema.struct({
      value: Schema.string,
      anotherValue: Schema.number,
      operation: Schema.string,
      helloWorld: Schema.string
    })
    const querySchema = Schema.struct({
      value: Schema.string,
      anotherValue: Schema.NumberFromString
    })
    const paramsSchema = Schema.struct({ operation: Schema.string })
    const bodySchema = Schema.struct({ helloWorld: Schema.string })

    const api = pipe(
      Api.api(),
      Api.post("doStuff", "/stuff/:operation", {
        response: responseSchema,
        request: {
          body: bodySchema,
          query: querySchema,
          params: paramsSchema
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("doStuff", ({ body, params, query }) => Effect.succeed({ ...body, ...query, ...params })),
      RouterBuilder.build
    )

    const result = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        client.doStuff({
          params: { operation: "operation" },
          query: { value: "value", anotherValue: 1 },
          body: { helloWorld: "helloWorld" }
        })
      )
    )

    expect(result).toEqual({
      operation: "operation",
      value: "value",
      anotherValue: 1,
      helloWorld: "helloWorld"
    })
  }).pipe(runTestEffect))

test("missing headers", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("getUser", "/user", {
        response: Schema.struct({ name: Schema.string }),
        request: {
          headers: Schema.struct({
            "X-MY-HEADER": Schema.NumberFromString,
            "Another-Header": Schema.string
          })
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle(
        "getUser",
        ({ headers: { "x-my-header": header } }) => Effect.succeed({ name: `patrik ${header}` })
      ),
      RouterBuilder.build
    )

    const result = yield* _(
      NodeTesting.make(app, api),
      // @ts-expect-error
      Effect.flatMap((client) => client.getUser()),
      Effect.flip
    )

    expect(result).toEqual(
      ClientError.makeServerSide(
        {},
        400,
        "Failed to encode headers. value must be an object, received undefined"
      )
    )
  }).pipe(runTestEffect))

test("supports interruption", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("getUser", "/user", {
        response: Schema.struct({ name: Schema.string })
      })
    )

    const generateName = vi.fn(() => ({ name: `test` }))

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("getUser", () => Effect.delay(Effect.sync(generateName), Duration.seconds(1))),
      RouterBuilder.build
    )

    const result = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        Effect.gen(function*($) {
          const request = yield* $(Effect.fork(client.getUser()))
          const result = yield $(Fiber.interrupt(request))
          return result
        })
      )
    )

    expect(Exit.isFailure(result)).toEqual(true)
    expect(Cause.isInterruptedOnly(result.i0)).toEqual(true)
    expect(generateName).not.toHaveBeenCalled()
  }).pipe(runTestEffect))

test("validation error", () =>
  Effect.gen(function*(_) {
    const app = ExampleServer.make(exampleApiGetQueryParameter).pipe(
      RouterBuilder.build
    )

    const result = yield* _(
      NodeTesting.make(app, exampleApiGetQueryParameter),
      Effect.flatMap((client) => client.hello({ query: { country: "abc" } })),
      Effect.flip
    )

    expect(result).toEqual(
      ClientError.makeServerSide(
        {},
        400,
        "Failed to encode query parameters. country must be a string matching the pattern ^[A-Z]{2}$, received \"abc\""
      )
    )
  }).pipe(runTestEffect))

test("no-content client non-2xx response", () =>
  Effect.gen(function*(_) {
    const app = HttpServer.router.empty.pipe(
      HttpServer.router.post("/test", HttpServer.response.text("validation error", { status: 400 }))
    )

    const result = yield* _(
      NodeTesting.make(app, exampleApiEmptyResponse),
      Effect.flatMap((client) => client.test({ body: "abc" })),
      Effect.flip
    )

    expect(result.status).toEqual(400)
    expect(result.message).toEqual("validation error")
  }).pipe(runTestEffect))
