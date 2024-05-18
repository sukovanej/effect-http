import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Effect, pipe } from "effect"
import { Api, Client, ClientError, Middlewares, RouterBuilder } from "effect-http"
import { HttpError } from "effect-http-error"
import { NodeTesting } from "effect-http-node"
import { apply } from "effect/Function"
import { expect } from "vitest"

const helloApi = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("ping", "/ping").pipe(Api.setResponseBody(Schema.Literal("pong")))
  ),
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(Api.setResponseBody(Schema.String))
  )
)

it.scoped(
  "basic auth",
  () =>
    Effect.gen(function*(_) {
      const app = pipe(
        RouterBuilder.make(helloApi),
        RouterBuilder.handle("ping", () => Effect.succeed("pong" as const)),
        RouterBuilder.handle("hello", () => Effect.succeed("test")),
        RouterBuilder.build,
        Middlewares.basicAuth(
          ({ password, user }) => {
            if (user === "mike" && password === "the-stock-broker") {
              return Effect.void
            }

            return Effect.fail(HttpError.unauthorizedError("Wrong credentials"))
          },
          { skipPaths: ["/ping"] }
        ),
        Effect.tapErrorCause(Effect.logError)
      )

      const client = yield* _(
        NodeTesting.make(app, helloApi)
      )

      const result = yield* _(
        Effect.all([
          Effect.flip(client.hello({}, Client.setBasic("wrong", "creds"))),
          client.hello({}, Client.setBasic("mike", "the-stock-broker")),
          client.ping({})
        ])
      )

      expect(result).toEqual([
        ClientError.makeServerSide("Wrong credentials", 401),
        "test",
        "pong"
      ])
    })
)

it.scoped(
  "cors",
  () =>
    Effect.gen(function*(_) {
      const api = Api.make().pipe(
        Api.addEndpoint(
          Api.get("test", "/test")
        )
      )

      const app = RouterBuilder.make(api).pipe(
        RouterBuilder.handle("test", () => Effect.void),
        RouterBuilder.build,
        Middlewares.cors({ allowedOrigins: ["localhost:3000"] })
      )

      const response = yield* _(
        NodeTesting.makeRaw(app),
        Effect.flatMap(apply(ClientRequest.get("/test")))
      )

      expect(response.headers["access-control-allow-origin"]).contains(
        "localhost:3000"
      )
    })
)
