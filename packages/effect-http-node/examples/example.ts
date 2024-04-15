import { Schema } from "@effect/schema"
import { Context, Effect, Layer, pipe } from "effect"
import { Api, RouterBuilder, Security } from "effect-http"

import { NodeRuntime } from "@effect/platform-node"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

// Schemas

const HumanSchema = Schema.Struct({
  height: Schema.Number,
  name: Schema.String
})
const Lesnek = Schema.Struct({ name: Schema.String })
const Standa = Schema.Record(
  Schema.String,
  Schema.Union(Schema.String, Schema.Number)
)

interface StuffService {
  value: number
}
const StuffService = Context.GenericTag<StuffService>("@services/StuffService")

const dummyStuff = pipe(
  Effect.succeed({ value: 42 }),
  Layer.effect(StuffService)
)

// Api

const getLesnek = Api.get("getLesnek", "/lesnek").pipe(
  Api.setResponseBody(Schema.String),
  Api.setRequestQuery(Lesnek),
  Api.setSecurity(Security.bearer({ name: "myAwesomeBearerAuth", bearerFormat: "JWT" }))
)

const api = pipe(
  Api.make({ title: "My awesome pets API", version: "1.0.0" }),
  Api.addEndpoint(getLesnek),
  Api.addEndpoint(
    Api.get("getMilan", "/milan").pipe(Api.setResponseBody(Schema.String))
  ),
  Api.addEndpoint(
    Api.get("test", "/test").pipe(Api.setResponseBody(Standa), Api.setRequestQuery(Lesnek))
  ),
  Api.addEndpoint(
    Api.post("standa", "/standa").pipe(Api.setResponseBody(Standa), Api.setRequestBody(Standa))
  ),
  Api.addEndpoint(
    Api.post("handleMilan", "/petr").pipe(Api.setResponseBody(HumanSchema), Api.setRequestBody(HumanSchema))
  ),
  Api.addEndpoint(
    Api.put("callStanda", "/api/zdar").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestBody(Schema.Struct({ zdar: Schema.Literal("zdar") }))
    )
  )
)

const app = pipe(
  RouterBuilder.make(api, { parseOptions: { errors: "all" } }),
  RouterBuilder.handle("getLesnek", ({ query }) =>
    pipe(
      Effect.succeed(`hello ${query.name}`),
      Effect.tap(() => Effect.logDebug("hello world"))
    )),
  RouterBuilder.handle("handleMilan", ({ body }) =>
    Effect.map(StuffService, ({ value }) => ({
      ...body,
      randomValue: body.height + value
    }))),
  RouterBuilder.handle("getMilan", () => Effect.succeed("test")),
  RouterBuilder.handle("test", ({ query: { name } }) => Effect.succeed({ name })),
  RouterBuilder.handle("standa", ({ body }) => Effect.succeed({ ...body, standa: "je borec" })),
  RouterBuilder.handle("callStanda", () => Effect.succeed("zdar")),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 4000 }),
  Effect.provide(dummyStuff),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
