import { FileSystem, HttpClient, HttpServer } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Context, Effect, pipe, Predicate } from "effect"
import {
  Api,
  ApiResponse,
  ApiSchema,
  Client,
  ClientError,
  Representation,
  RouterBuilder,
  Security,
  ServerError
} from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect } from "vitest"

it.scoped(
  "testing query",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello").pipe(
            Api.setResponseBody(Schema.String),
            Api.setRequestQuery(Schema.Struct({ input: Schema.NumberFromString }))
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
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello").pipe(Api.setResponseBody(Schema.String))
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
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello").pipe(
            Api.setResponseBody(Schema.String),
            Api.setRequestQuery(Schema.Struct({ input: Schema.NumberFromString }))
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
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello/:input").pipe(
            Api.setResponseBody(Schema.String),
            Api.setRequestPath(Schema.Struct({ input: Schema.NumberFromString }))
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
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello").pipe(
            Api.setRequestQuery(Schema.Struct({ input: Schema.NumberFromString })),
            Api.setResponseBody(Schema.Number),
            Api.addResponse(ApiResponse.make(201))
          )
        )
      )

      const app = pipe(
        RouterBuilder.make(api),
        RouterBuilder.handle(
          "hello",
          ({ query }) =>
            Effect.succeed(query.input === 1 ? { body: 69, status: 200 as const } : { status: 201 as const })
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
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.post("hello", "/hello").pipe(
            Api.setResponseBody(Schema.String),
            Api.setRequestBody(Schema.Struct({ input: Schema.NumberFromString }))
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
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.post("upload", "/upload").pipe(
            Api.setResponseBody(Schema.String),
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

const security = pipe(
  Security.bearer({ name: "myAwesomeBearer" }),
  Security.mapSchema(Schema.NumberFromString)
)

const securityApi = pipe(
  Api.make(),
  Api.addEndpoint(
    pipe(
      Api.get("hello", "/hello", { description: "test description" }),
      Api.setResponseBody(
        Schema.Struct({
          output: Schema.Number,
          security: Schema.Tuple(Schema.String, Schema.String)
        })
      ),
      Api.setRequestQuery(Schema.Struct({ input: Schema.NumberFromString })),
      Api.setSecurity(security)
    )
  )
)

it.scoped(
  "testing security",
  () =>
    Effect.gen(function*(_) {
      const app = pipe(
        RouterBuilder.make(securityApi),
        RouterBuilder.handle("hello", ({ query }, security) => {
          return Effect.succeed({
            output: query.input + 1,
            security: [security.toString(), "Right"] as const
          })
        }),
        RouterBuilder.build
      )

      const response = yield* _(
        NodeTesting.make(app, securityApi),
        Effect.flatMap(
          (client) => client.hello({ query: { input: 12 } }, HttpClient.request.setHeader("authorization", "Bearer 22"))
        )
      )

      expect(response).toEqual({ output: 13, security: ["22", "Right"] })
    })
)

it.scoped(
  "testing security - wrong header format",
  () =>
    Effect.gen(function*(_) {
      const app = pipe(
        RouterBuilder.make(securityApi),
        RouterBuilder.handle("hello", ({ query }, security) => {
          return Effect.succeed({
            output: query.input + 1,
            security: [security.toString(), "Right"] as const
          })
        }),
        RouterBuilder.build
      )

      const response = yield* _(
        NodeTesting.make(app, securityApi),
        Effect.flatMap((client) =>
          client.hello(
            { query: { input: 12 } },
            HttpClient.request.setHeader("authorization", "wrong-format")
          )
        ),
        Effect.flip
      )

      expect(response.message).toEqual("Invalid authorization header")
      expect(response.side).toEqual("server")
      expect((response as ClientError.ClientErrorServerSide).status).toEqual(401)
    })
)

it.scoped(
  "testing missing security",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello", { description: "test description" }).pipe(
            Api.setRequestQuery(Schema.Struct({ input: Schema.NumberFromString })),
            Api.setResponseBody(Schema.String),
            Api.setSecurity(Security.bearer({ name: "myAwesomeBearer" }))
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
        Effect.flatMap((client) => client.hello({ query: { input: 12 } })),
        Effect.flip
      )

      expect(response.message).toEqual("No authorization header")
    })
)

const myAwesomeBearerSecurity = pipe(
  Security.bearer({ name: "myAwesomeBearer" })
)

const myAwesomeBasicSecurity = pipe(
  Security.basic({ name: "myAwesomeBasic" }),
  Security.map((credentials) => `${credentials.user}:${credentials.pass}`)
)

it.scoped(
  "testing security - several security schemes handles as Eithers",
  () =>
    Effect.gen(function*(_) {
      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", "/hello", { description: "test description" }).pipe(
            Api.setResponseBody(Schema.String),
            Api.setRequestQuery(Schema.Struct({ input: Schema.NumberFromString })),
            Api.setSecurity(
              Security.or(myAwesomeBearerSecurity, myAwesomeBasicSecurity)
            )
          )
        )
      )

      const app = pipe(
        RouterBuilder.make(api),
        RouterBuilder.handle("hello", (_, security) => {
          return Effect.succeed(security.toString())
        }),
        RouterBuilder.build
      )

      const response = yield* _(
        NodeTesting.make(app, api),
        Effect.flatMap(
          (client) =>
            Effect.zip(
              client.hello({ query: { input: 12 } }, Client.setBearer("2")),
              client.hello({ query: { input: 12 } }, Client.setBasic("hello", "world"))
            )
        )
      )

      expect(response).toEqual(["2", "hello:world"])
    })
)
