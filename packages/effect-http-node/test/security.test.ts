import { Schema } from "@effect/schema"
import * as it from "@effect/vitest"
import { Effect, flow, pipe } from "effect"
import { Api, Client, RouterBuilder, Security } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect } from "vitest"

const xApiKey = Security.apiKey({ key: "x-api-key", in: "header" })

const parameters = [
  {
    security: pipe(Security.basic(), Security.map((auth) => auth.user)),
    name: "Security.basic",
    setAuth: Client.setBasic("user", "pass"),
    expected: "user"
  },
  {
    security: xApiKey,
    name: "Security.apiKey",
    setAuth: Client.setApiKey("x-api-key", "header", "api-key"),
    expected: "api-key"
  },
  {
    security: Security.bearer(),
    name: "Security.bearer",
    setAuth: Client.setBearer("token"),
    expected: "token"
  },
  {
    security: pipe(Security.bearer(), Security.as("my-value")),
    name: "Security.as",
    setAuth: Client.setBearer("whatever"),
    expected: "my-value"
  },
  {
    security: pipe(Security.bearer(), Security.map((token) => token + "1")),
    name: "Security.map",
    setAuth: Client.setBearer("token"),
    expected: "token1"
  },
  {
    security: pipe(Security.bearer(), Security.mapEffect((token) => Effect.succeed(token + "1"))),
    name: "Security.mapEffect",
    setAuth: Client.setBearer("token"),
    expected: "token1"
  },
  {
    security: pipe(Security.bearer(), Security.and(xApiKey), Security.map(([a, b]) => `${a}-${b}`)),
    name: "Security.and",
    setAuth: flow(Client.setBearer("token"), Client.setApiKey("x-api-key", "header", "api-key")),
    expected: "token-api-key"
  },
  {
    security: pipe(Security.bearer(), Security.or(xApiKey)),
    name: "Security.or",
    setAuth: Client.setBearer("token"),
    expected: "token"
  },
  {
    security: pipe(Security.bearer(), Security.or(xApiKey)),
    name: "Security.or",
    setAuth: Client.setApiKey("x-api-key", "header", "api-key"),
    expected: "api-key"
  }
]

parameters.forEach(({ expected, name, security, setAuth }) =>
  it.scoped(
    `security ${name}`,
    Effect.gen(function*(_) {
      const api = Api.make().pipe(
        Api.addEndpoint(
          Api.post("test", "/test").pipe(Api.setResponseBody(Schema.string), Api.setSecurity(security))
        )
      )

      const app = pipe(
        RouterBuilder.make(api),
        RouterBuilder.handle("test", (_, security) => Effect.succeed(security)),
        RouterBuilder.build
      )

      const result = yield* _(
        NodeTesting.make(app, api),
        Effect.flatMap((client) => client.test({}, setAuth))
      )

      expect(result).toBe(expected)
    })
  )
)
