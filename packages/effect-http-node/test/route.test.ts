import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as HttpServer from "@effect/platform/HttpServer"
import { Effect, Option } from "effect"
import { Route } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { apply } from "effect/Function"
import { describe, expect, test } from "vitest"
import {
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetOptionalField,
  exampleApiGetQueryParameter,
  exampleApiMultipleQueryValues,
  exampleApiParams,
  exampleApiPostNullableField,
  exampleApiRequestBody,
  exampleApiRequestHeaders
} from "./examples.js"
import { runTestEffect } from "./utils.js"

const testRoute = <R, E>(
  route: HttpServer.router.Route<R, E>,
  request: ClientRequest.ClientRequest
) =>
  NodeTesting.makeRaw(HttpServer.router.fromIterable([route])).pipe(
    Effect.flatMap(apply(request))
  )

const exampleRouteGetQueryParameter = exampleApiGetQueryParameter.pipe(
  Route.make("hello", ({ query }) => Effect.succeed(query.country))
)

const exampleRouteRequestBody = exampleApiRequestBody.pipe(
  Route.make("hello", ({ body }) => Effect.succeed(body.foo))
)

const exampleRouteRequestHeaders = exampleApiRequestHeaders.pipe(
  Route.make("hello", ({ headers }) => Effect.succeed(headers["x-header"]))
)

const exampleRouteParams = exampleApiParams.pipe(
  Route.make("hello", ({ params }) => Effect.succeed(params.value))
)

const exampleMultipleQueryAllErrors = exampleApiMultipleQueryValues.pipe(
  Route.make(
    "test",
    ({ query }) => Effect.succeed(`${query.value}, ${query.value}`),
    { parseOptions: { errors: "all" }, enableDocs: true }
  )
)

const exampleMultipleQueryFirstError = exampleApiMultipleQueryValues.pipe(
  Route.make("test", ({ query }) => Effect.succeed(`${query.value}, ${query.value}`))
)

describe("examples", () => {
  test("get", () =>
    Effect.gen(function*(_) {
      const route = exampleApiGet.pipe(
        Route.make("getValue", () => Effect.succeed(12))
      )

      const response = yield* _(testRoute(
        route,
        ClientRequest.get("/get-value")
      ))
      const body = yield* _(response.json)

      expect(body).toEqual(12)
    }).pipe(runTestEffect))

  test("post, optional body field", () =>
    Effect.gen(function*(_) {
      const route = exampleApiPostNullableField.pipe(
        Route.make("test", () => Effect.succeed({ value: Option.some("test") }))
      )

      const response = yield* _(testRoute(route, ClientRequest.post("/test")))
      const body = yield* _(response.json)

      expect(body).toEqual({ value: "test" })
    }).pipe(runTestEffect))

  test("get, query parameter", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteGetQueryParameter,
        ClientRequest.get("/hello").pipe(
          ClientRequest.appendUrlParam("country", "CZ")
        )
      ))
      const body = yield* _(response.json)

      expect(body).toEqual("CZ")
    }).pipe(runTestEffect))

  test("get, custom headers and status", () =>
    Effect.gen(function*(_) {
      const route = exampleApiGetCustomResponseWithHeaders.pipe(
        Route.make("hello", () =>
          Effect.succeed(
            {
              status: 201,
              headers: { "my-header": "hello" },
              content: { value: "test" }
            } as const
          ))
      )

      const response = yield* _(testRoute(route, ClientRequest.get("/hello")))
      const body = yield* _(response.json)

      expect(response.status).toEqual(201)
      expect(response.headers).toMatchObject({
        "my-header": "hello"
      })
      expect(body).toEqual({ value: "test" })
    }).pipe(runTestEffect))

  test("get, optional field", () =>
    Effect.gen(function*(_) {
      const route = exampleApiGetOptionalField.pipe(
        Route.make("hello", ({ query }) =>
          Effect.succeed({
            foo: query.value === "on" ? Option.some("hello") : Option.none()
          }))
      )

      const response = yield* _(testRoute(
        route,
        ClientRequest.get("/hello").pipe(
          ClientRequest.setUrlParam("value", "off")
        )
      ))
      const body = yield* _(response.json)

      expect(response.status).toEqual(200)
      expect(body).toEqual({})
    }).pipe(runTestEffect))

  test("post, request body", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteRequestBody,
        ClientRequest.post("/hello").pipe(
          ClientRequest.unsafeJsonBody({ foo: "hello" })
        )
      ))

      const body = yield* _(response.json)

      expect(body).toEqual("hello")
    }).pipe(runTestEffect))

  test("path parameters", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteParams,
        ClientRequest.post("/hello/a")
      ))

      const body = yield* _(response.json)

      expect(body).toEqual("a")
    }).pipe(runTestEffect))
})

describe("error reporting", () => {
  test("missing query parameter", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteGetQueryParameter,
        ClientRequest.get("/hello")
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "query",
        message: "country is missing"
      })
    }).pipe(runTestEffect))

  test("invalid query parameter", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteGetQueryParameter,
        ClientRequest.get("/hello").pipe(
          ClientRequest.setUrlParam("country", "CZE")
        )
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "query",
        message: "country must be a string matching the pattern ^[A-Z]{2}$, received \"CZE\""
      })
    }).pipe(runTestEffect))

  test("invalid JSON body - empty", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteRequestBody,
        ClientRequest.post("/hello")
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "body",
        message: "value must be an object, received null"
      })
    }).pipe(runTestEffect))

  test("invalid JSON body - text", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteRequestBody,
        ClientRequest.post("/hello").pipe(ClientRequest.textBody("value"))
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "body",
        message: "Invalid JSON"
      })
    }).pipe(runTestEffect))

  test("invalid JSON body - incorrect schema", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteRequestBody,
        ClientRequest.post("/hello").pipe(
          ClientRequest.unsafeJsonBody({ foo: 1 })
        )
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "body",
        message: "foo must be a string, received 1"
      })
    }).pipe(runTestEffect))

  test("invalid header", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteRequestHeaders,
        ClientRequest.post("/hello")
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "headers",
        message: "x-header is missing"
      })
    }).pipe(runTestEffect))

  test("invalid param", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleRouteParams,
        ClientRequest.post("/hello/c")
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "path",
        message: "value must be \"a\" or \"b\", received \"c\""
      })
    }).pipe(runTestEffect))

  test("invalid response", () =>
    Effect.gen(function*(_) {
      const exampleRouteInvalid = exampleApiParams.pipe(
        Route.make("hello", () => Effect.succeed(1 as unknown as string))
      )

      const response = yield* _(testRoute(
        exampleRouteInvalid,
        ClientRequest.post("/hello/a")
      ))

      expect(response.status).toEqual(500)
      expect(yield* _(response.json)).toEqual({
        error: "Invalid response content",
        message: "value must be a string, received 1"
      })
    }).pipe(runTestEffect))

  test("multiple errors", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleMultipleQueryAllErrors,
        ClientRequest.post("/test")
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "query",
        message: "another is missing, value is missing"
      })
    }).pipe(runTestEffect))

  test("multiple errors", () =>
    Effect.gen(function*(_) {
      const response = yield* _(testRoute(
        exampleMultipleQueryFirstError,
        ClientRequest.post("/test")
      ))

      expect(response.status).toEqual(400)
      expect(yield* _(response.json)).toEqual({
        error: "Request validation error",
        location: "query",
        message: "another is missing"
      })
    }).pipe(runTestEffect))
})
