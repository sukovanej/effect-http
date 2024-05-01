import { HttpServer } from "@effect/platform"
import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Cause, Duration, Effect, Either, Exit, Fiber, Match, pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect, test, vi } from "vitest"
import { exampleApiEmptyResponse, exampleApiGetQueryParameter } from "./examples.js"
import { runTestEffect } from "./utils.js"

it.scoped(
  "quickstart example e2e",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("getUser", "/user").pipe(
            Api.setResponseBody(Schema.Struct({ name: Schema.String })),
            Api.setRequestQuery(Schema.Struct({ id: Schema.NumberFromString }))
          )
        )
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
    })
)

test.each(["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"] as const)(
  "Dummy call - %s",
  (method) =>
    Effect.gen(function*(_) {
      const responseSchema = Schema.Struct({ name: Schema.String })

      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.endpoint(method, "doStuff", "/stuff").pipe(
            Api.setResponseBody(responseSchema)
          )
        )
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

it.scoped(
  "All input types",
  () =>
    Effect.gen(function*(_) {
      const responseSchema = Schema.Struct({
        value: Schema.String,
        anotherValue: Schema.Number,
        operation: Schema.String,
        helloWorld: Schema.String
      })
      const querySchema = Schema.Struct({
        value: Schema.String,
        anotherValue: Schema.NumberFromString
      })
      const paramsSchema = Schema.Struct({ operation: Schema.String })
      const bodySchema = Schema.Struct({ helloWorld: Schema.String })

      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.post("doStuff", "/stuff/:operation").pipe(
            Api.setResponseBody(responseSchema),
            Api.setRequestBody(bodySchema),
            Api.setRequestQuery(querySchema),
            Api.setRequestPath(paramsSchema)
          )
        )
      )

      const app = pipe(
        RouterBuilder.make(api),
        RouterBuilder.handle("doStuff", ({ body, path, query }) => Effect.succeed({ ...body, ...query, ...path })),
        RouterBuilder.build
      )

      const result = yield* _(
        NodeTesting.make(app, api),
        Effect.flatMap((client) =>
          client.doStuff({
            path: { operation: "operation" },
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
    })
)

it.scoped(
  "missing headers",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("getUser", "/user").pipe(
            Api.setResponseBody(Schema.Struct({ name: Schema.String })),
            Api.setRequestHeaders(Schema.Struct({
              "x-my-header": Schema.NumberFromString,
              "another-header": Schema.String
            }))
          )
        )
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

      expect(result.message).toEqual("Failed to encode headers. value must be an object, received undefined")
      expect(result.side).toEqual("client")

      // TODO
      // expect(result).toEqual(
      //  ClientError.makeClientSide(
      //    {},
      //    "Failed to encode headers. value must be an object, received undefined"
      //  )
      // )
    })
)

it.scoped(
  "supports interruption",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("getUser", "/user").pipe(Api.setResponseBody(Schema.Struct({ name: Schema.String })))
        )
      )

      const generateName = vi.fn(() => ({ name: `test` }))

      const app = pipe(
        RouterBuilder.make(api),
        RouterBuilder.handle("getUser", () => Effect.delay(Effect.sync(generateName), Duration.seconds(1))),
        RouterBuilder.build
      )

      const client = yield* NodeTesting.make(app, api)

      const result = yield* _(
        Effect.fork(client.getUser({})),
        Effect.flatMap(Fiber.interrupt)
      )

      const cause = yield* Exit.causeOption(result)

      expect(Exit.isFailure(result)).toEqual(true)
      expect(generateName).not.toHaveBeenCalled()
      expect(Cause.isInterruptedOnly(cause)).toEqual(true)
    })
)

it.scoped(
  "validation error",
  () =>
    Effect.gen(function*(_) {
      const app = ExampleServer.make(exampleApiGetQueryParameter).pipe(
        RouterBuilder.build
      )

      const result = yield* _(
        NodeTesting.make(app, exampleApiGetQueryParameter),
        Effect.flatMap((client) => client.hello({ query: { country: "abc" } })),
        Effect.flip
      )

      expect(result.message).toEqual(
        "Failed to encode query parameters. country must be a string matching the pattern ^[A-Z]{2}$, received \"abc\""
      )
      expect(result.side).toEqual("client")

      // TODO
      // expect(result).toMatchObject(
      //  ClientError.makeClientSide(
      //    {},
      //    "Failed to encode query parameters. country must be a string matching the pattern ^[A-Z]{2}$, received \"abc\""
      //  )
      // )
    })
)

it.scoped(
  "no-content client non-2xx response",
  () =>
    Effect.gen(function*(_) {
      const app = HttpServer.router.empty.pipe(
        HttpServer.router.post("/test", HttpServer.response.text("validation error", { status: 400 }))
      )

      const result = yield* _(
        NodeTesting.make(app, exampleApiEmptyResponse),
        Effect.flatMap((client) => client.test({ body: "abc" })),
        Effect.flip
      )

      expect(result.side).toEqual("server")

      if (result.side === "server") {
        expect(result.status).toEqual(400)
      }
      expect(result.message).toEqual("validation error")
    })
)

it.scoped(
  "multiple responses",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          pipe(
            Api.get("test", "/test"),
            Api.setResponse({ status: 200, body: Schema.String }),
            Api.addResponse({ status: 201, body: Schema.Number }),
            Api.addResponse({ status: 400, body: Schema.String }),
            Api.addResponse({ status: 422, body: Schema.String })
          )
        )
      )

      const app = ExampleServer.make(api).pipe(RouterBuilder.build)

      const result = yield* _(
        NodeTesting.make(app, api),
        Effect.flatMap((client) => client.test({})),
        Effect.either
      )

      const r = Either.isRight(result) ?
        Match.value(result.right).pipe(
          Match.when({ status: 200 }, ({ body }) => body),
          Match.when({ status: 201 }, ({ body }) => body.toString()),
          Match.exhaustive
        ) :
        "nope"

      expect(typeof r).toBe("string")
    })
)

it.scoped(
  "multiple with only one 2xx",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          pipe(
            Api.get("test", "/test"),
            Api.setResponse({ status: 200, body: Schema.String }),
            Api.addResponse({ status: 400, body: Schema.String }),
            Api.addResponse({ status: 422, body: Schema.String })
          )
        )
      )

      const app = RouterBuilder.make(api).pipe(
        RouterBuilder.handle("test", () => Effect.succeed("test")),
        RouterBuilder.build
      )

      const result = yield* _(
        NodeTesting.make(app, api),
        Effect.flatMap((client) => client.test({}))
      )

      expect(result).toBe("test")
    })
)
