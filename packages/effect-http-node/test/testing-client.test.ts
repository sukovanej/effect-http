import { FileSystem, HttpServer } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Context, Effect, pipe, Predicate, ReadonlyRecord, Secret, Unify } from "effect"
import { Api, ClientError, Representation, RouterBuilder, SecurityScheme, ServerError } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect, test } from "vitest"

import { runTestEffect } from "./utils.js"

test("testing query", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get(
        "hello",
        "/hello",
        {
          response: Schema.string,
          request: {
            query: Schema.struct({ input: Schema.NumberFromString })
          }
        }
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }) => Effect.succeed(`${query.input + 1}`)),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello({ query: { input: 12 } }))
    )

    expect(response).toEqual("13")
  }).pipe(runTestEffect))

test("testing failure", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("hello", "/hello", {
        response: Schema.string
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", () => Effect.fail(ServerError.notFoundError("oh oh"))),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello()),
      Effect.flip
    )

    expect(response).toEqual(ClientError.makeServerSide("oh oh", 404))
  }).pipe(runTestEffect))

test("testing with dependencies", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("hello", "/hello", {
        response: Schema.string,
        request: {
          query: Schema.struct({ input: Schema.NumberFromString })
        }
      })
    )

    const MyService = Context.GenericTag<number>("@services/MyService")

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }) => Effect.map(MyService, (v) => `${query.input + v}`)),
      RouterBuilder.mapRouter(HttpServer.router.provideService(MyService, 2)),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello({ query: { input: 12 } })),
      Effect.provideService(MyService, 2)
    )

    expect(response).toEqual("14")
  }).pipe(runTestEffect))

test("testing params", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("hello", "/hello/:input", {
        response: Schema.string,
        request: {
          params: Schema.struct({ input: Schema.NumberFromString })
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ params }) => Effect.succeed(`${params.input + 1}`)),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello({ params: { input: 12 } }))
    )

    expect(response).toEqual("13")
  }).pipe(runTestEffect))

test("testing multiple responses", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get("hello", "/hello", {
        response: [
          {
            content: Schema.number,
            status: 200
          },
          {
            status: 201
          }
        ],
        request: {
          query: Schema.struct({ input: Schema.NumberFromString })
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }) =>
        Effect.succeed(
          query.input === 1
            ? { content: 69, status: 200 as const }
            : { status: 201 as const }
        )),
      RouterBuilder.build
    )

    const [response1, response2] = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        Effect.all(
          [
            client.hello({ query: { input: 1 } }),
            client.hello({ query: { input: 2 } })
          ] as const
        )
      )
    )

    expect(response1).toMatchObject({ content: 69, status: 200 })
    expect(response2).toMatchObject({ status: 201 })
  }).pipe(runTestEffect))

test("testing body", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.post("hello", "/hello", {
        response: Schema.string,
        request: {
          body: Schema.struct({ input: Schema.NumberFromString })
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ body }) => Effect.succeed(`${body.input + 1}`)),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello({ body: { input: 12 } }))
    )

    expect(response).toEqual("13")
  }).pipe(runTestEffect))

test("form data", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.post("upload", "/upload", {
        request: {
          body: Api.FormData
        },
        response: {
          content: Schema.string,
          status: 200,
          representations: [Representation.plainText]
        }
      })
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("upload", () =>
        Effect.gen(function*(_) {
          const request = yield* _(HttpServer.request.ServerRequest)
          const body = yield* _(request.multipart)
          const file = body["file"]

          if (file === null) {
            return yield* _(ServerError.badRequest("Expected \"file\""))
          }

          if (Predicate.isString(file)) {
            return yield* _(ServerError.badRequest("Expected file"))
          }

          const fs = yield* _(FileSystem.FileSystem)
          const content = yield* _(fs.readFileString(file[0].path))

          return { content, status: 200 as const }
        }).pipe(Effect.scoped)),
      RouterBuilder.build
    )

    const formData = new FormData()
    formData.append("file", new Blob(["my file content"]))

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.upload({ body: formData })),
      Effect.provide(NodeContext.layer)
    )

    expect(response.status).toEqual(200)
    expect(response.content).toEqual("my file content")
  }).pipe(runTestEffect))

test("testing security", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get(
        "hello",
        "/hello",
        {
          response: Schema.struct({
            output: Schema.number,
            security: Schema.tuple(Schema.string, Schema.string)
          }),
          request: {
            query: Schema.struct({ input: Schema.NumberFromString })
          }
        },
        {
          description: "test description",
          security: {
            myAwesomeBearer: SecurityScheme.bearer({
              tokenSchema: Schema.NumberFromString
            })
          }
        }
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }, security) => {
        return Effect.succeed({
          output: query.input + 1,
          security: [security.myAwesomeBearer.token.toString(), "Right"] as const
        })
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        client.hello({ query: { input: 12 } }, {
          myAwesomeBearer: 22
        })
      )
    )

    expect(response).toEqual({ output: 13, security: ["22", "Right"] })
  }).pipe(runTestEffect))

test("testing security - wrong header format", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get(
        "hello",
        "/hello",
        {
          response: Schema.struct({
            output: Schema.number,
            security: Schema.tuple(Schema.string, Schema.string)
          }),
          request: {
            query: Schema.struct({ input: Schema.NumberFromString })
          }
        },
        {
          description: "test description",
          security: {
            myAwesomeBearer: SecurityScheme.bearer({
              tokenSchema: Schema.NumberFromString
            })
          }
        }
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }, security) => {
        return Effect.succeed({
          output: query.input + 1,
          security: [security.myAwesomeBearer.token.toString(), "Right"] as const
        })
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        client.hello({ query: { input: 12 } }, {
          // @ts-expect-error
          myAwesomeBearer: "wrong-format"
        })
      ),
      Effect.flip
    )

    expect(response).toEqual(
      ClientError.makeClientSide("Failed to encode security token. value must be , received \"<unexpected>\"")
    )
  }).pipe(runTestEffect))

test("testing missing security", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get(
        "hello",
        "/hello",
        {
          response: Schema.string,
          request: {
            query: Schema.struct({ input: Schema.NumberFromString })
          }
        },
        {
          description: "test description",
          security: {
            myAwesomeBearer: SecurityScheme.bearer({
              tokenSchema: Schema.NumberFromString
            })
          }
        }
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }) => {
        return Effect.succeed(`${query.input + 1}`)
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        // @ts-expect-error
        client.hello({ query: { input: 12 } }, {})
      ),
      Effect.flip
    )

    expect(response).toEqual(ClientError.makeServerSide(
      {},
      400,
      "Must provide at lest one secure scheme credential"
    ))
  }).pipe(runTestEffect))

test("testing security - several security cred with same type", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get(
        "hello",
        "/hello",
        {
          response: Schema.string,
          request: {
            query: Schema.struct({ input: Schema.NumberFromString })
          }
        },
        {
          description: "test description",
          security: {
            myAwesomeBearer: SecurityScheme.bearer({
              tokenSchema: Schema.NumberFromString
            })
          }
        }
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }) => {
        return Effect.succeed(`${query.input + 1}`)
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        // @ts-expect-error
        client.hello({ query: { input: 12 } }, {})
      ),
      Effect.flip
    )

    expect(response).toEqual(ClientError.makeServerSide(
      {},
      400,
      "Must provide at lest one secure scheme credential"
    ))
  }).pipe(runTestEffect))

test("testing security - several security schemes handles as Eithers", () =>
  Effect.gen(function*(_) {
    const api = pipe(
      Api.api(),
      Api.get(
        "hello",
        "/hello",
        {
          response: Schema.record(Schema.string, Schema.tuple(Schema.string, Schema.string)),
          request: {
            query: Schema.struct({ input: Schema.NumberFromString })
          }
        },
        {
          description: "test description",
          security: {
            myAwesomeBearer: SecurityScheme.bearer({
              tokenSchema: Schema.NumberFromString
            }),
            myAwesomeBasic: SecurityScheme.basic({
              tokenSchema: Schema.Secret
            })
          }
        }
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", (_, security) => {
        const result = ReadonlyRecord.map(
          security,
          (authResult, name) =>
            Effect.match(Unify.unify(authResult.token), {
              onFailure: () => [name, "error"] as const,
              onSuccess: (success) =>
                [name, typeof success === "number" ? success.toString() : Secret.value(success)] as const
            })
        )

        return Effect.all(result)
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) =>
        client.hello({ query: { input: 12 } }, {
          myAwesomeBearer: 2
        })
      )
    )

    expect(response).toEqual(
      {
        myAwesomeBearer: ["myAwesomeBearer", "2"],
        myAwesomeBasic: ["myAwesomeBasic", "error"]
      }
    )
  }).pipe(runTestEffect))
