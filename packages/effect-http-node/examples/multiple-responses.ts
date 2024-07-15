import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Logger, LogLevel, pipe, Random } from "effect"
import { Api, ApiResponse, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const helloEndpoint = Api.post("hello", "/hello").pipe(
  Api.setResponseBody(Schema.Number),
  Api.setResponseHeaders(Schema.Struct({
    "my-header": pipe(
      Schema.NumberFromString,
      Schema.annotations({ description: "My header" })
    )
  })),
  Api.addResponse(ApiResponse.make(201, Schema.Number)),
  Api.addResponse({ status: 204, headers: Schema.Struct({ "x-another": Schema.NumberFromString }) })
)

const api = pipe(
  Api.make(),
  Api.addEndpoint(helloEndpoint)
)

const randomChoice = <A extends ReadonlyArray<any>>(...values: A) =>
  Random.nextIntBetween(0, values.length).pipe(Effect.map((i) => values[i]))

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", () =>
    randomChoice(
      { status: 200, body: 12, headers: { "my-header": 69 } },
      { status: 201, body: 12 },
      { status: 204, headers: { "x-another": 12 } }
    )),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
