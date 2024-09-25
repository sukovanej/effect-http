import { Cookies, FetchHttpClient, Headers, HttpClientRequest, HttpServerResponse } from "@effect/platform"
import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Effect, Option } from "effect"
import { Api, Handler, HttpError } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { describe, expect } from "vitest"
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

const exampleRouteGetQueryParameter = Api.getEndpoint(exampleApiGetQueryParameter, "hello").pipe(
  Handler.make(({ query }) => Effect.succeed(query.country))
)

const exampleRouteRequestBody = Api.getEndpoint(exampleApiRequestBody, "hello").pipe(
  Handler.make(({ body }) => Effect.succeed(body.foo))
)

const exampleRouteRequestHeaders = Api.getEndpoint(exampleApiRequestHeaders, "hello").pipe(
  Handler.make(({ headers }) => Effect.succeed(headers["x-header"]))
)

const exampleRouteParams = Api.getEndpoint(exampleApiParams, "hello").pipe(
  Handler.make(({ path }) => Effect.succeed(path.value))
)

const exampleMultipleQueryAllErrors = Api.getEndpoint(exampleApiMultipleQueryValues, "test").pipe(
  Handler.make(
    ({ query }) => Effect.succeed(`${query.value}, ${query.value}`),
    { parseOptions: { errors: "all" } }
  )
)

const exampleMultipleQueryFirstError = Api.getEndpoint(exampleApiMultipleQueryValues, "test").pipe(
  Handler.make(({ query }) => Effect.succeed(`${query.value}, ${query.value}`))
)

const redirectApi = Api.post("test", "/test").pipe(
  Api.setResponseStatus(302),
  Api.setResponseHeaders(
    Schema.Struct({
      "set-cookie": Schema.String,
      location: Schema.String
    })
  )
)

const exampleRedirect = redirectApi.pipe(
  Handler.make(() =>
    Effect.fail(HttpError.found(undefined, {
      cookies: Cookies.fromSetCookie("session=123; Path=/; HttpOnly"),
      headers: Headers.fromInput({ location: "/" })
    }))
  )
)

const exampleRedirectRaw = redirectApi.pipe(
  Handler.makeRaw(
    HttpServerResponse.empty({
      status: 302,
      cookies: Cookies.fromSetCookie("session=123; Path=/; HttpOnly"),
      headers: Headers.fromInput({ location: "/" })
    })
  )
)

describe("examples", () => {
  it.scoped("get", () =>
    Effect.gen(function*() {
      const getValueHandler = Api.getEndpoint(exampleApiGet, "getValue").pipe(
        Handler.make(() => Effect.succeed(12))
      )
      const client = yield* NodeTesting.handler(getValueHandler)
      const response = yield* client.execute(HttpClientRequest.get("/get-value"))
      expect(yield* response.json).toEqual(12)
    }))

  it.scoped("post, optional body field", () =>
    Effect.gen(function*(_) {
      const route = Api.getEndpoint(exampleApiPostNullableField, "test").pipe(
        Handler.make(() => Effect.succeed({ value: Option.some("test") }))
      )
      const client = yield* NodeTesting.handler(route)
      const response = yield* client.execute(HttpClientRequest.post("/test"))
      expect(yield* response.json).toEqual({ value: "test" })
    }))

  it.scoped("get, query parameter", () =>
    Effect.gen(function*() {
      const client = yield* NodeTesting.handler(exampleRouteGetQueryParameter)
      const response = yield* client.execute(
        HttpClientRequest.get("/hello").pipe(HttpClientRequest.appendUrlParam("country", "CZ"))
      )
      expect(yield* response.json).toEqual("CZ")
    }))

  it.scoped("get, custom headers and status", () =>
    Effect.gen(function*(_) {
      const handler = Api.getEndpoint(exampleApiGetCustomResponseWithHeaders, "hello").pipe(
        Handler.make(() =>
          Effect.succeed({ status: 201, headers: { "my-header": "hello" }, body: { value: "test" } } as const)
        )
      )

      const client = yield* NodeTesting.handler(handler)
      const response = yield* client.execute(HttpClientRequest.get("/hello"))
      const body = yield* response.json

      expect(response.status).toEqual(201)
      expect(response.headers).toMatchObject({
        "my-header": "hello"
      })
      expect(body).toEqual({ value: "test" })
    }))

  it.scoped("get, optional field", () =>
    Effect.gen(function*(_) {
      const handler = Api.getEndpoint(exampleApiGetOptionalField, "hello").pipe(
        Handler.make(({ query }) =>
          Effect.succeed({
            foo: query.value === "on" ? Option.some("hello") : Option.none()
          })
        )
      )

      const client = yield* NodeTesting.handler(handler)
      const response = yield* HttpClientRequest.get("/hello").pipe(
        HttpClientRequest.setUrlParam("value", "off"),
        client.execute
      )
      const body = yield* response.json

      expect(response.status).toEqual(200)
      expect(body).toEqual({})
    }))

  it.scoped("post, request body", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteRequestBody)
      const response = yield* client.execute(
        HttpClientRequest.post("/hello").pipe(
          HttpClientRequest.bodyUnsafeJson({ foo: "hello" })
        )
      )
      const body = yield* response.json
      expect(body).toEqual("hello")
    }))

  it.scoped("path parameters", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteParams)
      const response = yield* client.execute(HttpClientRequest.post("/hello/a"))
      expect(yield* response.json).toEqual("a")
    }))
})

describe("error reporting", () => {
  it.scoped("missing query parameter", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteGetQueryParameter)
      const response = yield* client.execute(HttpClientRequest.get("/hello"))

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "query",
        message: `{ readonly country: a string matching the pattern ^[A-Z]{2}$ }
└─ ["country"]
   └─ is missing`
      })
    }))

  it.scoped("invalid query parameter", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteGetQueryParameter)
      const response = yield* client.execute(
        HttpClientRequest.get("/hello").pipe(
          HttpClientRequest.setUrlParam("country", "CZE")
        )
      )

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "query",
        message: `{ readonly country: a string matching the pattern ^[A-Z]{2}$ }
└─ ["country"]
   └─ Must be a valid country code`
      })
    }))

  it.scoped("invalid JSON body - empty", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteRequestBody)
      const response = yield* client.execute(HttpClientRequest.post("/hello"))

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "body",
        message: "Expected { readonly foo: string }, actual null"
      })
    }))

  it.scoped("invalid JSON body - text", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteRequestBody)
      const response = yield* client.execute(
        HttpClientRequest.post("/hello").pipe(HttpClientRequest.bodyText("value"))
      )

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "body",
        message: "Invalid JSON"
      })
    }))

  it.scoped("invalid JSON body - incorrect schema", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteRequestBody)
      const response = yield* client.execute(
        HttpClientRequest.post("/hello").pipe(
          HttpClientRequest.bodyUnsafeJson({ foo: 1 })
        )
      )

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "body",
        "message": `{ readonly foo: string }
└─ ["foo"]
   └─ Expected string, actual 1`
      })
    }))

  it.scoped("invalid header", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteRequestHeaders)
      const response = yield* client.execute(HttpClientRequest.post("/hello"))

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "headers",
        message: `{ readonly x-header: "a" | "b" }
└─ ["x-header"]
   └─ is missing`
      })
    }))

  it.scoped("invalid param", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRouteParams)
      const response = yield* client.execute(HttpClientRequest.post("/hello/c"))

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "path",
        message: `{ readonly value: "a" | "b" }
└─ ["value"]
   └─ "a" | "b"
      ├─ Expected "a", actual "c"
      └─ Expected "b", actual "c"`
      })
    }))

  it.scoped("invalid response", () =>
    Effect.gen(function*(_) {
      const helloHandler = Api.getEndpoint(exampleApiParams, "hello").pipe(
        Handler.make(() => Effect.succeed(1 as unknown as string))
      )

      const client = yield* NodeTesting.handler(helloHandler)
      const response = yield* client.execute(HttpClientRequest.post("/hello/a"))

      expect(response.status).toEqual(500)
      expect(yield* response.json).toEqual({
        error: "Invalid response body",
        message: "Expected string, actual 1"
      })
    }))

  it.scoped("multiple errors", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleMultipleQueryAllErrors)
      const response = yield* client.execute(HttpClientRequest.post("/test"))

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "query",
        message: `{ readonly value: "x" | "y"; readonly another: string }
├─ ["value"]
│  └─ is missing
└─ ["another"]
   └─ is missing`
      })
    }))

  it.scoped("multiple errors", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleMultipleQueryFirstError)
      const response = yield* client.execute(HttpClientRequest.post("/test"))

      expect(response.status).toEqual(400)
      expect(yield* response.json).toEqual({
        error: "Request validation error",
        location: "query",
        message: `{ readonly value: "x" | "y"; readonly another: string }
└─ ["value"]
   └─ is missing`
      })
    }))

  it.scoped("redirect using makeRaw", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRedirectRaw)
      const response = yield* client.execute(HttpClientRequest.post("/test")).pipe(
        Effect.provideService(FetchHttpClient.RequestInit, { redirect: "manual" })
      )

      expect(response.status).toEqual(302)
      expect(response.headers).toMatchObject({ "set-cookie": "session=123; Path=/; HttpOnly" })
    }))

  it.scoped("redirect using make", () =>
    Effect.gen(function*(_) {
      const client = yield* NodeTesting.handler(exampleRedirect)
      const response = yield* client.execute(HttpClientRequest.post("/test")).pipe(
        Effect.provideService(FetchHttpClient.RequestInit, { redirect: "manual" })
      )

      expect(response.status).toEqual(302)
      expect(response.headers).toMatchObject({ "set-cookie": "session=123; Path=/; HttpOnly" })
    }))

  it.scoped("concat", () =>
    Effect.gen(function*() {
      const getValueHandler = Handler.make(Api.getEndpoint(exampleApiGet, "getValue"), () => Effect.succeed(12))
      const testHandler = Handler.make(Api.getEndpoint(exampleApiPostNullableField, "test"), () =>
        Effect.succeed({ value: Option.some("test") }))

      const handler = Handler.concat(getValueHandler, testHandler)

      const client = yield* NodeTesting.handler(handler)
      const [response1, response2] = yield* Effect.zip(
        client.execute(HttpClientRequest.get("/get-value")),
        client.execute(HttpClientRequest.post("/test"))
      )

      expect(yield* response1.json).toEqual(12)
      expect(yield* response2.json).toEqual({ value: "test" })
    }))

  it.scoped("concatAll", () =>
    Effect.gen(function*() {
      const helloHandler = Api.getEndpoint(exampleApiParams, "hello").pipe(
        Handler.make(({ path }) => Effect.succeed(path.value))
      )
      const getValueHandler = Handler.make(Api.getEndpoint(exampleApiGet, "getValue"), () => Effect.succeed(12))
      const testHandler = Handler.make(Api.getEndpoint(exampleApiPostNullableField, "test"), () =>
        Effect.succeed({ value: Option.some("test") }))

      const handler = Handler.concatAll(getValueHandler, testHandler, helloHandler)

      const client = yield* NodeTesting.handler(handler)
      const [response1, response2, response3] = yield* Effect.all([
        client.execute(HttpClientRequest.get("/get-value")),
        client.execute(HttpClientRequest.post("/test")),
        client.execute(HttpClientRequest.post("/hello/a"))
      ])

      expect(yield* response1.json).toEqual(12)
      expect(yield* response2.json).toEqual({ value: "test" })
      expect(yield* response3.json).toEqual("a")
    }))
})
