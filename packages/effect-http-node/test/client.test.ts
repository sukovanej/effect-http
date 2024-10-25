import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import * as it from "@effect/vitest"
import { Cause, Deferred, Duration, Effect, Either, Exit, Fiber, Layer, Match, pipe, Schema } from "effect"
import { Api, Client, ExampleServer, RouterBuilder, Security } from "effect-http"
import { NodeSwaggerFiles, NodeTesting } from "effect-http-node"
import { createServer } from "node:http"
import { expect, vi } from "vitest"
import { exampleApiEmptyResponse, exampleApiGetQueryParameter } from "./examples.js"

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

it.scoped.each(["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"] as const)(
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
    })
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

      expect(result.message).toEqual(
        "Failed to encode headers. Expected { readonly x-my-header: NumberFromString; readonly another-header: string }, actual undefined"
      )
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
        `Failed to encode query parameters. { readonly country: a string matching the pattern ^[A-Z]{2}$ }
└─ ["country"]
   └─ Must be a valid country code`
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
      const app = HttpRouter.empty.pipe(
        HttpRouter.post("/test", HttpServerResponse.text("validation error", { status: 400 }))
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

it.scoped(
  "security context is not required on client side",
  () =>
    Effect.gen(function*(_) {
      class MyTag extends Effect.Tag("MyTag")<MyTag, { value: string }>() {
        static live = Layer.succeed(this, this.of({ value: "hello" }))
      }

      const securityWithContext = Security.mapEffect(Security.basic(), () => MyTag.value)

      const api = pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("test", "/test").pipe(
            Api.setResponseBody(Schema.String),
            Api.setSecurity(securityWithContext)
          )
        )
      )

      const app = RouterBuilder.make(api).pipe(
        RouterBuilder.handle("test", () => Effect.succeed("test")),
        RouterBuilder.build
      )

      // TODO: refactor to utils or maybe expose from the NodeTesting module
      const serverUrl = Effect.map(HttpServer.HttpServer, (server) => {
        const address = server.address

        if (address._tag === "UnixAddress") {
          return address.path
        }

        return `http://localhost:${address.port}`
      })

      const NodeServerLive = NodeHttpServer.layer(() => createServer(), {
        port: undefined
      })

      const baseUrl = yield* Effect.flatMap(Deferred.make<string>(), (allocatedUrl) =>
        serverUrl.pipe(
          Effect.flatMap((url) => Deferred.succeed(allocatedUrl, url)),
          Effect.flatMap(() => Layer.launch(HttpServer.serve(app))),
          Effect.provide(NodeServerLive),
          Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
          Effect.provide(NodeContext.layer),
          Effect.provide(MyTag.live),
          Effect.forkScoped,
          Effect.flatMap(() => Deferred.await(allocatedUrl))
        ))

      const client = Client.make(api, { baseUrl })

      const result = yield* client.test({}, Client.setBasic("user", "pass"))

      expect(result).toBe("test")
    })
)
