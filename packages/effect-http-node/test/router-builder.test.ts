import { HttpClient } from "@effect/platform"
import * as it from "@effect/vitest"
import { Effect, Option } from "effect"
import { Api, RouterBuilder } from "effect-http"
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
    () =>
      Effect.gen(function*(_) {
        const router = exampleApiGet.pipe(
          RouterBuilder.make,
          RouterBuilder.handle("getValue", () => Effect.succeed(12)),
          RouterBuilder.getRouter
        )

        const client = yield* NodeTesting.makeRaw(router)
        const response = yield* client(HttpClient.request.get("/get-value"))
        const body = yield* response.json

        expect(response.status).toEqual(200)
        expect(body).toEqual(12)
      })
  )

  it.scoped(
    "post, optional body field",
    () =>
      Effect.gen(function*(_) {
        const router = exampleApiPostNullableField.pipe(
          RouterBuilder.make,
          RouterBuilder.handle("test", () => Effect.succeed({ value: Option.some("test") })),
          RouterBuilder.getRouter
        )

        const client = yield* NodeTesting.makeRaw(router)
        const response = yield* client(HttpClient.request.post("/test"))
        const body = yield* response.json

        expect(response.status).toEqual(200)
        expect(body).toEqual({ value: "test" })
      })
  )

  it.scoped(
    "get, query parameter",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteGetQueryParameter)
        const response = yield* _(
          HttpClient.request.get("/hello"),
          HttpClient.request.appendUrlParam("country", "CZ"),
          client
        )

        const body = yield* response.json

        expect(response.status).toEqual(200)
        expect(body).toEqual("CZ")
      })
  )

  it.scoped(
    "get, custom headers and status",
    () =>
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

        const client = yield* NodeTesting.makeRaw(router)
        const response = yield* client(HttpClient.request.get("/hello"))
        const body = yield* response.json

        expect(response.status).toEqual(201)
        expect(response.headers).toMatchObject({
          "my-header": "hello"
        })
        expect(body).toEqual({ value: "test" })
      })
  )

  it.scoped(
    "get, optional field",
    () =>
      Effect.gen(function*(_) {
        const router = exampleApiGetOptionalField.pipe(
          RouterBuilder.make,
          RouterBuilder.handle("hello", ({ query }) =>
            Effect.succeed({
              foo: query.value === "on" ? Option.some("hello") : Option.none()
            })),
          RouterBuilder.getRouter
        )

        const client = yield* NodeTesting.makeRaw(router)
        const response = yield* _(
          HttpClient.request.get("/hello"),
          HttpClient.request.setUrlParam("value", "off"),
          client
        )
        const body = yield* response.json

        expect(response.status).toEqual(200)
        expect(body).toEqual({})
      })
  )

  it.scoped(
    "post, request body",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteRequestBody)
        const response = yield* _(
          HttpClient.request.post("/hello"),
          HttpClient.request.unsafeJsonBody({ foo: "hello" }),
          client
        )

        const body = yield* response.json

        expect(response.status).toEqual(200)
        expect(body).toEqual("hello")
      })
  )

  it.scoped(
    "path parameters",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteParams)
        const response = yield* client(HttpClient.request.post("/hello/a"))

        const body = yield* response.json

        expect(response.status).toEqual(200)
        expect(body).toEqual("a")
      })
  )
})

describe("error reporting", () => {
  it.scoped(
    "missing query parameter",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteGetQueryParameter)
        const response = yield* client(HttpClient.request.get("/hello"))

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "query",
          message: `{ readonly country: a string matching the pattern ^[A-Z]{2}$ }
└─ ["country"]
   └─ is missing`
        })
      })
  )

  it.scoped(
    "invalid query parameter",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteGetQueryParameter)
        const response = yield* _(
          HttpClient.request.get("/hello"),
          HttpClient.request.setUrlParam("country", "CZE"),
          client
        )

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "query",
          message: `{ readonly country: a string matching the pattern ^[A-Z]{2}$ }
└─ ["country"]
   └─ Must be a valid country code`
        })
      })
  )

  it.scoped(
    "invalid JSON body - empty",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteRequestBody)
        const response = yield* client(HttpClient.request.post("/hello"))

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "body",
          message: "Expected { readonly foo: string }, actual null"
        })
      })
  )

  it.scoped(
    "invalid JSON body - text",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteRequestBody)
        const response = yield* _(
          HttpClient.request.post("/hello"),
          HttpClient.request.textBody("value"),
          client
        )

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "body",
          message: "Invalid JSON"
        })
      })
  )

  it.scoped(
    "invalid JSON body - incorrect schema",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteRequestBody)
        const response = yield* _(
          HttpClient.request.post("/hello"),
          HttpClient.request.unsafeJsonBody({ foo: 1 }),
          client
        )

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "body",
          message: `{ readonly foo: string }
└─ ["foo"]
   └─ Expected string, actual 1`
        })
      })
  )

  it.scoped(
    "invalid header",
    () =>
      Effect.gen(function*(_) {
        const client = yield* NodeTesting.makeRaw(exampleRouteRequestHeaders)
        const response = yield* client(HttpClient.request.post("/hello"))

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "headers",
          "message": `{ readonly x-header: "a" | "b" }
└─ ["x-header"]
   └─ is missing`
        })
      })
  )

  it.scoped(
    "invalid param",
    () =>
      Effect.gen(function*(_) {
        const response = yield* _(
          NodeTesting.makeRaw(exampleRouteParams),
          Effect.flatMap(apply(HttpClient.request.post("/hello/c")))
        )

        expect(response.status).toEqual(400)
        expect(yield* response.json).toEqual({
          error: "Request validation error",
          location: "path",
          "message": `{ readonly value: "a" | "b" }
└─ ["value"]
   └─ "a" | "b"
      ├─ Expected "a", actual "c"
      └─ Expected "b", actual "c"`
        })
      })
  )

  it.scoped(
    "invalid response",
    () =>
      Effect.gen(function*(_) {
        const exampleRouteInvalid = exampleApiParams.pipe(
          RouterBuilder.make,
          RouterBuilder.handle("hello", () => Effect.succeed(1 as unknown as string)),
          RouterBuilder.getRouter
        )

        const client = yield* NodeTesting.makeRaw(exampleRouteInvalid)
        const response = yield* client(HttpClient.request.post("/hello/a"))

        expect(response.status).toEqual(500)
        expect(yield* response.json).toEqual({
          error: "Invalid response body",
          message: "Expected string, actual 1"
        })
      })
  )
})

it.scoped(
  "single full response",
  () =>
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

      const client = yield* NodeTesting.makeRaw(app)

      const [response1, response2] = yield* Effect.all([
        client(HttpClient.request.post("/hello")),
        client(HttpClient.request.post("/another"))
      ])

      expect(response1.status).toEqual(200)
      expect(response1.headers).toMatchObject({ "my-header": "test" })

      expect(response2.status).toEqual(200)

      expect(yield* response1.json).toEqual(12)
      expect(yield* response2.json).toEqual(12)
    })
)

it.scoped(
  "representations",
  () =>
    Effect.gen(function*(_) {
      const app = exampleApiRepresentations.pipe(
        RouterBuilder.make,
        RouterBuilder.handle("test", () => Effect.succeed("test")),
        RouterBuilder.getRouter
      )

      const client = yield* NodeTesting.makeRaw(app)
      const [textResponse, jsonResponse, xmlResponse] = yield* Effect.all([
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

      expect(textResponse.status).toEqual(200)
      expect(yield* textResponse.text).toEqual("test")
      expect(textResponse.headers["content-type"]).toEqual("text/plain")

      expect(yield* jsonResponse.json).toEqual("test")
      expect(jsonResponse.status).toEqual(200)
      expect(jsonResponse.headers["content-type"]).toEqual("application/json")

      // if no representation content-type matches the `Accept` header just use the first one
      expect(yield* xmlResponse.text).toEqual("test")
      expect(xmlResponse.status).toEqual(200)
      expect(xmlResponse.headers["content-type"]).toEqual("text/plain")
    })
)

it.scoped(
  "merge data-first",
  () =>
    Effect.gen(function*(_) {
      const routerBuilder1 = RouterBuilder.make(exampleApiFullResponse).pipe(
        RouterBuilder.handle("hello", () =>
          Effect.succeed({ headers: { "my-header": "test" }, status: 200 as const, body: 12 }))
      )

      const routerBuilder2 = RouterBuilder.make(exampleApiFullResponse).pipe(
        RouterBuilder.handle("another", () =>
          Effect.succeed(13))
      )

      const app = RouterBuilder.merge(routerBuilder1, routerBuilder2).pipe(
        RouterBuilder.build
      )

      const client = yield* NodeTesting.makeRaw(app)
      const [response1, response2] = yield* Effect.all([
        client(HttpClient.request.post("/hello")),
        client(HttpClient.request.post("/another"))
      ])

      expect(response1.status).toEqual(200)
      expect(yield* response1.json).toEqual(12)
      expect(response1.headers["my-header"]).toEqual("test")

      expect(response2.status).toEqual(200)
      expect(yield* response2.json).toEqual(13)
    })
)

it.scoped(
  "merge data-last",
  () =>
    Effect.gen(function*(_) {
      const addEndpoint = <I extends string>(id: I) => Api.addEndpoint(Api.get(id, `/endpoint-${id}`))
      const api = Api.make().pipe(
        addEndpoint("1"),
        addEndpoint("2"),
        addEndpoint("3")
      )

      const routerBuilder1 = RouterBuilder.make(api).pipe(RouterBuilder.handle("1", () => Effect.void))
      const routerBuilder2 = RouterBuilder.make(api).pipe(RouterBuilder.handle("2", () => Effect.void))
      const routerBuilder3 = RouterBuilder.make(api).pipe(RouterBuilder.handle("3", () => Effect.void))

      const app = routerBuilder1.pipe(
        RouterBuilder.merge(routerBuilder2),
        RouterBuilder.merge(routerBuilder3),
        RouterBuilder.build
      )

      const client = yield* NodeTesting.makeRaw(app)
      const responses = yield* Effect.all([
        client(HttpClient.request.get("/endpoint-1")),
        client(HttpClient.request.get("/endpoint-2")),
        client(HttpClient.request.get("/endpoint-3"))
      ])

      for (const response of responses) {
        expect(response.status).toEqual(200)
      }
    })
)
