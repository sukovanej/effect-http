import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Effect, identity, pipe } from "effect"
import { Api, ClientError, Middlewares, RouterBuilder, ServerError } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { apply } from "effect/Function"
import { expect } from "vitest"

const helloApi = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("ping", "/ping").pipe(Api.setResponseBody(Schema.literal("pong")))
  ),
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(Api.setResponseBody(Schema.string))
  )
)

it.scoped(
  "basic auth",
  Effect.gen(function*(_) {
    const app = pipe(
      RouterBuilder.make(helloApi),
      RouterBuilder.handle("ping", () => Effect.succeed("pong" as const)),
      RouterBuilder.handle("hello", () => Effect.succeed("test")),
      RouterBuilder.build,
      Middlewares.basicAuth(
        ({ password, user }) => {
          if (user === "mike" && password === "the-stock-broker") {
            return Effect.unit
          }

          return Effect.fail(ServerError.unauthorizedError("Wrong credentials"))
        },
        { skipPaths: ["/ping"] }
      ),
      Effect.tapErrorCause(Effect.logError)
    )

    const incorrectCredentials = Buffer.from("user:password").toString("base64")
    const correctCredentials = Buffer.from("mike:the-stock-broker").toString(
      "base64"
    )

    const client = (
      mapRequest: (
        request: ClientRequest.ClientRequest
      ) => ClientRequest.ClientRequest
    ) => NodeTesting.make(app, helloApi, { mapRequest })

    const result = yield* _(
      Effect.all([
        client(
          ClientRequest.setHeader(
            "Authorization",
            `Basic ${incorrectCredentials}`
          )
        ).pipe(
          Effect.flatMap((client) =>
            client
              .hello({
                headers: { Authorization: `Basic ${incorrectCredentials}` }
              })
              .pipe(Effect.flip)
          )
        ),
        client(
          ClientRequest.setHeader(
            "Authorization",
            `Basic ${incorrectCredentials}`
          )
        ).pipe(
          Effect.flatMap((client) =>
            client.hello({
              headers: { Authorization: `Basic ${correctCredentials}` }
            })
          )
        ),
        client(identity).pipe(Effect.flatMap((client) => client.ping({})))
      ])
    )

    expect(result).toEqual([
      ClientError.makeServerSide("Wrong credentials", 403),
      "test",
      "pong"
    ])
  })
)

it.scoped(
  "cors",
  Effect.gen(function*(_) {
    const api = Api.make().pipe(
      Api.addEndpoint(
        Api.get("test", "/test")
      )
    )

    const app = RouterBuilder.make(api).pipe(
      RouterBuilder.handle("test", () => Effect.unit),
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
