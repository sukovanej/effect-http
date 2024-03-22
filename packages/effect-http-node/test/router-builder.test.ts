import { HttpClient } from "@effect/platform"
import * as it from "@effect/vitest"
import { Effect, Option } from "effect"
import { RouterBuilder } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { apply } from "effect/Function"
import { describe, expect } from "vitest"
import {
  exampleApiFullResponse,
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetOptionalField,
  exampleApiGetQueryParameter,
  exampleApiParams,
  exampleApiPostNullableField,
  exampleApiRepresentations,
  exampleApiRequestBody,
  exampleApiRequestHeaders
} from "./examples.js"

const exampleRouteGetQueryParameter = exampleApiGetQueryParameter.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ query }) => Effect.succeed(query.country)),
  RouterBuilder.getRouter
)

const exampleRouteRequestBody = exampleApiRequestBody.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ body }) => Effect.succeed(body.foo)),
  RouterBuilder.getRouter
)

const exampleRouteRequestHeaders = exampleApiRequestHeaders.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ headers }) => Effect.succeed(headers["x-header"])),
  RouterBuilder.getRouter
)

const exampleRouteParams = exampleApiParams.pipe(
  RouterBuilder.make,
  RouterBuilder.handle("hello", ({ path }) => Effect.succeed(path.value)),
  RouterBuilder.getRouter
)

describe("examples", () => {
  it.scoped(
    "get",
    Effect.gen(function*(_) {
      const router = exampleApiGet.pipe(
        RouterBuilder.make,
        RouterBuilder.handle("getValue", () => Effect.succeed(12)),
        RouterBuilder.getRouter
      )

      const response = yield* _(
        NodeTesting.makeRaw(router),
        Effect.flatMap(apply(HttpClient.request.get("/get-value")))
      )
      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual(12)
    })
  )

  it.scoped(
    "post, optional body field",
    Effect.gen(function*(_) {
      const router = exampleApiPostNullableField.pipe(
        RouterBuilder.make,
        RouterBuilder.handle("test", () => Effect.succeed({ value: Option.some("test") })),
        RouterBuilder.getRouter
      )

      const response = yield* _(
        NodeTesting.makeRaw(router),
        Effect.flatMap(apply(HttpClient.request.post("/test")))
      )
      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual({ value: "test" })
    })
  )

  it.scoped(
    "get, query parameter",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteGetQueryParameter),
        Effect.flatMap(
          apply(
            HttpClient.request.get("/hello").pipe(
              HttpClient.request.appendUrlParam("country", "CZ")
            )
          )
        )
      )

      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual("CZ")
    })
  )

  it.scoped(
    "get, custom headers and status",
    Effect.gen(function*(_) {
      const router = exampleApiGetCustomResponseWithHeaders.pipe(
        RouterBuilder.make,
        RouterBuilder.handle("hello", () =>
          Effect.succeed(
            {
              status: 201,
              headers: { "my-header": "hello" },
              body: { value: "test" }
            } as const
          )),
        RouterBuilder.getRouter
      )

      const response = yield* _(
        NodeTesting.makeRaw(router),
        Effect.flatMap(apply(HttpClient.request.get("/hello")))
      )
      const body = yield* _(response.json)

      expect(response.status).toEqual(201)
      expect(response.headers).toMatchObject({
        "my-header": "hello"
      })
      expect(body).toEqual({ value: "test" })
    })
  )

  it.scoped(
    "get, optional field",
    Effect.gen(function*(_) {
      const router = exampleApiGetOptionalField.pipe(
        RouterBuilder.make,
        RouterBuilder.handle("hello", ({ query }) =>
          Effect.succeed({
            foo: query.value === "on" ? Option.some("hello") : Option.none()
          })),
        RouterBuilder.getRouter
      )

      const response = yield* _(
        NodeTesting.makeRaw(router),
        Effect.flatMap(
          apply(
            HttpClient.request.get("/hello").pipe(
              HttpClient.request.setUrlParam("value", "off")
            )
          )
        )
      )
      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual({})
    })
  )

  it.scoped(
    "post, request body",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteRequestBody),
        Effect.flatMap(
          apply(
            HttpClient.request.post("/hello").pipe(
              HttpClient.request.unsafeJsonBody({ foo: "hello" })
            )
          )
        )
      )

      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual("hello")
    })
  )

  it.scoped(
    "path parameters",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteParams),
        Effect.flatMap(apply(HttpClient.request.post("/hello/a")))
      )

      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual("a")
    })
  )
})

describe("error reporting", () => {
  it.scoped(
    "missing query parameter",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteGetQueryParameter),
        Effect.flatMap(apply(HttpClient.request.get("/hello")))
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "query",
        message: "country is missing"
      })
    })
  )

  it.scoped(
    "invalid query parameter",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteGetQueryParameter),
        Effect.flatMap(
          apply(
            HttpClient.request.get("/hello").pipe(
              HttpClient.request.setUrlParam("country", "CZE")
            )
          )
        )
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "query",
        message: "country must be a string matching the pattern ^[A-Z]{2}$, received \"CZE\""
      })
    })
  )

  it.scoped(
    "invalid JSON body - empty",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteRequestBody),
        Effect.flatMap(apply(HttpClient.request.post("/hello")))
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "body",
        message: "value must be an object, received null"
      })
    })
  )

  it.scoped(
    "invalid JSON body - text",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteRequestBody),
        Effect.flatMap(
          apply(
            HttpClient.request.post("/hello").pipe(HttpClient.request.textBody("value"))
          )
        )
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "body",
        message: "Invalid JSON"
      })
    })
  )

  it.scoped(
    "invalid JSON body - incorrect schema",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteRequestBody),
        Effect.flatMap(
          apply(
            HttpClient.request.post("/hello").pipe(
              HttpClient.request.unsafeJsonBody({ foo: 1 })
            )
          )
        )
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "body",
        message: "foo must be a string, received 1"
      })
    })
  )

  it.scoped(
    "invalid header",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteRequestHeaders),
        Effect.flatMap(apply(HttpClient.request.post("/hello")))
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "headers",
        message: "x-header is missing"
      })
    })
  )

  it.scoped(
    "invalid param",
    Effect.gen(function*(_) {
      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteParams),
        Effect.flatMap(apply(HttpClient.request.post("/hello/c")))
      )

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "path",
        message: "value must be \"a\" or \"b\", received \"c\""
      })
    })
  )

  it.scoped(
    "invalid response",
    Effect.gen(function*(_) {
      const exampleRouteInvalid = exampleApiParams.pipe(
        RouterBuilder.make,
        RouterBuilder.handle("hello", () => Effect.succeed(1 as unknown as string)),
        RouterBuilder.getRouter
      )

      const response = yield* _(
        NodeTesting.makeRaw(exampleRouteInvalid),
        Effect.flatMap(apply(HttpClient.request.post("/hello/a")))
      )

      expect(response.status).toEqual(500)
      expect(yield* _(response.json)).toEqual({
        error: "Invalid response body",
        message: "value must be a string, received 1"
      })
    })
  )
})

it.scoped(
  "single full response",
  Effect.gen(function*(_) {
    const app = exampleApiFullResponse.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("hello", () =>
        Effect.succeed({
          body: 12,
          headers: { "my-header": "test" },
          status: 200 as const
        })),
      RouterBuilder.handle("another", () => Effect.succeed(12)),
      RouterBuilder.getRouter
    )

    const [response1, response2] = yield* _(
      NodeTesting.makeRaw(app),
      Effect.flatMap((client) =>
        Effect.all([
          client(HttpClient.request.post("/hello")),
          client(HttpClient.request.post("/another"))
        ])
      )
    )

    expect(response1.status).toEqual(200)
    expect(response1.headers).toMatchObject({ "my-header": "test" })

    expect(response2.status).toEqual(200)

    expect(yield* _(response1.json)).toEqual(12)
    expect(yield* _(response2.json)).toEqual(12)
  })
)

it.scoped(
  "representations",
  Effect.gen(function*(_) {
    const app = exampleApiRepresentations.pipe(
      RouterBuilder.make,
      RouterBuilder.handle("test", () => Effect.succeed("test")),
      RouterBuilder.getRouter
    )

    const [textResponse, jsonResponse, xmlResponse] = yield* _(
      NodeTesting.makeRaw(app),
      Effect.flatMap((client) =>
        Effect.all([
          client(
            HttpClient.request.post("/test").pipe(HttpClient.request.accept("text/plain"))
          ),
          client(
            HttpClient.request.post("/test").pipe(
              HttpClient.request.accept("application/json")
            )
          ),
          client(
            HttpClient.request.post("/test").pipe(
              HttpClient.request.accept("application/xml")
            )
          )
        ])
      )
    )

    expect(textResponse.status).toEqual(200)
    expect(yield* _(textResponse.text)).toEqual("test")
    expect(textResponse.headers["content-type"]).toEqual("text/plain")

    expect(yield* _(jsonResponse.json)).toEqual("test")
    expect(jsonResponse.status).toEqual(200)
    expect(jsonResponse.headers["content-type"]).toEqual("application/json")

    // if no representation content-type matches the `Accept` header just use the first one
    expect(yield* _(xmlResponse.text)).toEqual("test")
    expect(xmlResponse.status).toEqual(200)
    expect(xmlResponse.headers["content-type"]).toEqual("text/plain")
  })
)
