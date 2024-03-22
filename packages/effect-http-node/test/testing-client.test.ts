import { FileSystem, HttpServer } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Context, Effect, pipe, Predicate, ReadonlyRecord, Secret, Unify } from "effect"
import {
  Api,
  ApiResponse,
  ApiSchema,
  ClientError,
  Representation,
  RouterBuilder,
  SecurityScheme,
  ServerError
} from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect } from "vitest"

it.scoped(
  "testing query",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello").pipe(
          Api.setResponseBody(Schema.string),
          Api.setRequestQuery(Schema.struct({ input: Schema.NumberFromString }))
        )
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
  })
)

it.scoped(
  "testing failure",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello").pipe(Api.setResponseBody(Schema.string))
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", () => Effect.fail(ServerError.notFoundError("oh oh"))),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello({})),
      Effect.flip
    )

    expect(response).toEqual(ClientError.makeServerSide("oh oh", 404))
  })
)

it.scoped(
  "testing with dependencies",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello").pipe(
          Api.setResponseBody(Schema.string),
          Api.setRequestQuery(Schema.struct({ input: Schema.NumberFromString }))
        )
      )
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
  })
)

it.scoped(
  "testing params",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello/:input").pipe(
          Api.setResponseBody(Schema.string),
          Api.setRequestPath(Schema.struct({ input: Schema.NumberFromString }))
        )
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ path }) => Effect.succeed(`${path.input + 1}`)),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, api),
      Effect.flatMap((client) => client.hello({ path: { input: 12 } }))
    )

    expect(response).toEqual("13")
  })
)

it.scoped(
  "testing multiple responses",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello").pipe(
          Api.setRequestQuery(Schema.struct({ input: Schema.NumberFromString })),
          Api.setResponseBody(Schema.number),
          Api.addResponse(ApiResponse.make(201))
        )
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle(
        "hello",
        ({ query }) => Effect.succeed(query.input === 1 ? { body: 69, status: 200 as const } : { status: 201 as const })
      ),
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

    expect(response1).toMatchObject({ body: 69, status: 200 })
    expect(response2).toMatchObject({ status: 201 })
  })
)

it.scoped(
  "testing body",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.post("hello", "/hello").pipe(
          Api.setResponseBody(Schema.string),
          Api.setRequestBody(Schema.struct({ input: Schema.NumberFromString }))
        )
      )
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
  })
)

it.scoped(
  "form data",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.post("upload", "/upload").pipe(
          Api.setResponseBody(Schema.string),
          Api.setResponseRepresentations([Representation.plainText]),
          Api.setRequestBody(ApiSchema.FormData)
        )
      )
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
          return yield* _(fs.readFileString(file[0].path))
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

    expect(response).toEqual("my file content")
  })
)

const securityApi = pipe(
  Api.make(),
  Api.addEndpoint(
    pipe(
      Api.get("hello", "/hello", { description: "test description" }),
      Api.setResponseBody(
        Schema.struct({
          output: Schema.number,
          security: Schema.tuple(Schema.string, Schema.string)
        })
      ),
      Api.setRequestQuery(Schema.struct({ input: Schema.NumberFromString })),
      Api.addSecurity(
        "myAwesomeBearer",
        SecurityScheme.bearer({ tokenSchema: Schema.NumberFromString })
      )
    )
  )
)

it.scoped(
  "testing security",
  Effect.gen(function*(_) {
    const app = pipe(
      RouterBuilder.make(securityApi),
      RouterBuilder.handle("hello", ({ query }, security) => {
        return Effect.succeed({
          output: query.input + 1,
          security: [security.myAwesomeBearer.token.toString(), "Right"] as const
        })
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, securityApi),
      Effect.flatMap((client) =>
        client.hello({ query: { input: 12 } }, {
          myAwesomeBearer: 22
        })
      )
    )

    expect(response).toEqual({ output: 13, security: ["22", "Right"] })
  })
)

it.scoped(
  "testing security - wrong header format",
  Effect.gen(function*(_) {
    const app = pipe(
      RouterBuilder.make(securityApi),
      RouterBuilder.handle("hello", ({ query }, security) => {
        return Effect.succeed({
          output: query.input + 1,
          security: [security.myAwesomeBearer.token.toString(), "Right"] as const
        })
      }),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, securityApi),
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
  })
)

it.scoped(
  "testing missing security",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello", { description: "test description" }).pipe(
          Api.setRequestQuery(Schema.struct({ input: Schema.NumberFromString })),
          Api.setResponseBody(Schema.string),
          Api.addSecurity("myAwesomeBearer", SecurityScheme.bearer({ tokenSchema: Schema.NumberFromString }))
        )
      )
    )

    const app = pipe(
      RouterBuilder.make(api),
      RouterBuilder.handle("hello", ({ query }) => Effect.succeed(`${query.input + 1}`)),
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
  })
)

it.scoped(
  "testing security - several security cred with same type",
  Effect.gen(function*(_) {
    const app = pipe(
      RouterBuilder.make(securityApi),
      RouterBuilder.handle(
        "hello",
        ({ query }) => Effect.succeed({ security: ["hello", "world"] as const, output: query.input + 1 })
      ),
      RouterBuilder.build
    )

    const response = yield* _(
      NodeTesting.make(app, securityApi),
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
  })
)

it.scoped(
  "testing security - several security schemes handles as Eithers",
  Effect.gen(function*(_) {
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.get("hello", "/hello", { description: "test description" }).pipe(
          Api.setResponseBody(Schema.record(Schema.string, Schema.tuple(Schema.string, Schema.string))),
          Api.setRequestQuery(Schema.struct({ input: Schema.NumberFromString })),
          Api.setSecurity({
            myAwesomeBearer: SecurityScheme.bearer({
              tokenSchema: Schema.NumberFromString
            }),
            myAwesomeBasic: SecurityScheme.basic({
              tokenSchema: Schema.Secret
            })
          })
        )
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
  })
)
