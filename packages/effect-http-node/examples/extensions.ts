import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Metric, pipe } from "effect"
import { Api, Middlewares, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user", { description: "Returns a User by id" }).pipe(
      Api.setResponseBody(Schema.String)
    )
  ),
  Api.addEndpoint(
    Api.get("metrics", "/metrics").pipe(
      Api.setResponseBody(Schema.Unknown)
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", () => Effect.succeed("Hello").pipe(Effect.tap(() => Effect.log("hello")))),
  RouterBuilder.handle("metrics", () => Metric.snapshot),
  RouterBuilder.build,
  Middlewares.accessLog(),
  Middlewares.endpointCallsMetric(),
  Middlewares.uuidLogAnnotation()
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
