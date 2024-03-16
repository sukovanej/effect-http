import { HttpServer } from "@effect/platform"
import { Context, Effect, Either, Layer, Option, pipe, ReadonlyArray } from "effect"
import { Api, ApiResponse, ClientError, RouterBuilder, ServerError } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { createHash } from "node:crypto"
import { describe, expect, test } from "vitest"
import {
  exampleApiEmptyResponse,
  exampleApiFullResponse,
  exampleApiGet,
  exampleApiGetCustomResponseWithHeaders,
  exampleApiGetHeaders,
  exampleApiGetOptionalField,
  exampleApiMultipleResponses,
  exampleApiOptional,
  exampleApiOptionalParams,
  exampleApiPutResponse
} from "./examples.js"
import { runTestEffect } from "./utils.js"

const Service1 = Context.GenericTag<number>("@services/Service1")
const Service2 = Context.GenericTag<string>("@services/Service2")

const layer1 = Layer.succeed(Service2, "hello world")
const layer2 = pipe(
  Effect.map(Service2, (value) => value.length),
  Layer.effect(Service1)
)

test("layers", async () => {
  const layer = Layer.provide(layer2, layer1)

  const app = RouterBuilder.make(exampleApiGet).pipe(
    RouterBuilder.handle("getValue", () => Effect.map(Service1, (value) => value + 2)),
    RouterBuilder.build
  )

  const response = await pipe(
    NodeTesting.make(app, exampleApiGet),
    Effect.provide(layer),
    Effect.flatMap((client) => client.getValue({})),
    runTestEffect
  )

  expect(response).toEqual(13)
})

test("human-readable error response", async () => {
  const app = RouterBuilder.make(exampleApiGet).pipe(
    RouterBuilder.handle("getValue", () => Effect.fail(ServerError.notFoundError("Didnt find it"))),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiGet),
    Effect.flatMap((client) => client.getValue({})),
    Effect.flip,
    runTestEffect
  )

  expect(result).toMatchObject(
    ClientError.makeServerSide("Didnt find it", 404)
  )
})

test("headers", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiGetHeaders),
    RouterBuilder.handle("hello", ({ headers: { "x-client-id": apiKey } }) =>
      Effect.succeed({
        clientIdHash: createHash("sha256").update(apiKey).digest("base64")
      })),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiGetHeaders),
    Effect.flatMap((client) => client.hello({ headers: { "x-client-id": "abc" } })),
    runTestEffect
  )

  expect(result).toEqual({
    clientIdHash: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0="
  })
})

test.each(
  [
    { response: ServerError.conflictError("error"), status: 409 }
  ] as const
)("status codes", async ({ response, status }) => {
  const app = pipe(
    RouterBuilder.make(exampleApiGet),
    RouterBuilder.handle("getValue", () => Effect.fail(response)),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiGet),
    Effect.flatMap((client) => Effect.either(client.getValue({}))),
    runTestEffect
  )

  expect(result).toMatchObject(Either.left({ status }))
})

test("Attempt to add a non-existing operation should fail as a safe guard", () => {
  expect(() =>
    RouterBuilder.make(exampleApiPutResponse).pipe(
      // @ts-expect-error
      RouterBuilder.handle("nonExistingOperation", () => "")
    )
  ).toThrowError()
})

test("Custom headers and status", async () => {
  const app = exampleApiGetCustomResponseWithHeaders.pipe(
    RouterBuilder.make,
    RouterBuilder.handle("hello", () =>
      Effect.succeed(
        {
          body: { value: "test" },
          headers: { "my-header": "hello" },
          status: 201
        } as const
      )),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiGetCustomResponseWithHeaders),
    Effect.flatMap((client) =>
      // TODO: this header is not necessary, it is provided intentionally?
      client.hello({ headers: { "x-client-id": "abc" } })
    ),
    runTestEffect
  )

  expect(result).toEqual({
    status: 201,
    body: { value: "test" },
    headers: { "my-header": "hello" }
  })
})

test("Response containing optional field", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiGetOptionalField),
    RouterBuilder.handle("hello", ({ query }) =>
      Effect.succeed({
        foo: query.value === "on" ? Option.some("hello") : Option.none()
      })),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiGetOptionalField),
    Effect.flatMap((client) =>
      Effect.all([
        client.hello({ query: { value: "on" } }),
        client.hello({ query: { value: "off" } })
      ])
    ),
    runTestEffect
  )

  expect(result).toEqual([
    { foo: Option.some("hello") },
    { foo: Option.none() }
  ])
})

test("failing after unauthorized middleware", async () => {
  const app = RouterBuilder.make(exampleApiGet).pipe(
    RouterBuilder.handle("getValue", () => Effect.succeed(1)),
    RouterBuilder.build,
    HttpServer.middleware.make(() => ServerError.toServerResponse(ServerError.unauthorizedError("sorry bro")))
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiGet),
    Effect.flatMap((client) => client.getValue({})),
    Effect.flip,
    runTestEffect
  )

  expect(result).toEqual(ClientError.makeServerSide("sorry bro", 403))
})

describe("type safe responses", () => {
  test("responses must have unique status codes", () => {
    expect(() => {
      pipe(
        Api.make(),
        Api.addEndpoint(
          Api.post("hello", "/hello").pipe(
            Api.addResponse(ApiResponse.make(201)),
            Api.addResponse(ApiResponse.make(201))
          )
        )
      )
    }).toThrowError()
  })

  test("example", async () => {
    const app = RouterBuilder.make(exampleApiMultipleResponses).pipe(
      RouterBuilder.handle("hello", ({ query }) => {
        const response = query.value == 12
          ? {
            body: 12,
            headers: { "x-another-200": 12 },
            status: 200 as const
          }
          : query.value == 13
          ? { body: 13, status: 201 as const }
          : { headers: { "x-another": 13 }, status: 204 as const }

        return Effect.succeed(response)
      }),
      RouterBuilder.build
    )

    const result = await pipe(
      NodeTesting.make(app, exampleApiMultipleResponses),
      Effect.flatMap((client) =>
        Effect.all(
          ReadonlyArray.map([12, 13, 14], (value) => client.hello({ query: { value } }))
        )
      ),
      runTestEffect
    )

    expect(result).toMatchObject([
      { body: 12, headers: { "x-another-200": 12 }, status: 200 },
      { body: 13, headers: {}, status: 201 },
      { body: undefined, headers: { "x-another": 13 }, status: 204 }
    ])
  })
})

test("optional headers / query / params fields", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiOptional),
    RouterBuilder.handle("hello", ({ headers, path, query }) => Effect.succeed({ query, path, headers })),
    RouterBuilder.build
  )

  const params = [
    {
      query: { value: 12 },
      headers: { value: 12 },
      path: { value: 12 }
    },
    {
      query: { value: 12, another: "query-another-2" },
      headers: { value: 12 },
      path: { value: 12, another: "params-another-2" }
    },
    {
      query: { value: 12 },
      headers: {
        value: 12,
        another: "headers-another-3",
        hello: "params-hello-3"
      },
      path: { value: 12 }
    }
  ] as const

  const result = await pipe(
    NodeTesting.make(app, exampleApiOptional),
    Effect.flatMap((client) => Effect.all(ReadonlyArray.map(params, client.hello))),
    runTestEffect
  )

  expect(result).toStrictEqual(params)
})

test("optional parameters", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiOptionalParams),
    RouterBuilder.handle("hello", ({ path }) => Effect.succeed({ path })),
    RouterBuilder.build
  )

  const params = [
    { path: { value: 12 } },
    { path: { value: 12, another: "another" } }
  ] as const

  const result = await pipe(
    NodeTesting.make(app, exampleApiOptionalParams),
    Effect.flatMap((client) => Effect.all(ReadonlyArray.map(params, client.hello))),
    runTestEffect
  )

  expect(result).toStrictEqual(params)
})

test("single full response", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiFullResponse),
    RouterBuilder.handle("hello", () =>
      Effect.succeed({
        body: 12,
        headers: { "my-header": "test" },
        status: 200 as const
      })),
    RouterBuilder.handle("another", () => Effect.succeed(12)),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiFullResponse),
    Effect.flatMap((client) => Effect.all([client.hello({}), client.another({})])),
    runTestEffect
  )

  expect(result).toMatchObject([
    {
      status: 200,
      body: 12,
      headers: { "my-header": "test" }
    },
    12
  ])
})

test("empty response", async () => {
  const app = pipe(
    RouterBuilder.make(exampleApiEmptyResponse),
    RouterBuilder.handle("test", () => Effect.unit),
    RouterBuilder.build
  )

  const result = await pipe(
    NodeTesting.make(app, exampleApiEmptyResponse),
    Effect.flatMap((client) => client.test({ body: "test" })),
    runTestEffect
  )

  expect(result).toBe(undefined)
})
