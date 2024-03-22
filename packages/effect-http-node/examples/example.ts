import { Schema } from "@effect/schema"
import { Context, Effect, Layer, pipe } from "effect"
import { Api, RouterBuilder, Security } from "effect-http"

import { NodeRuntime } from "@effect/platform-node"
import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

// Schemas

const HumanSchema = Schema.struct({
  height: Schema.number,
  name: Schema.string
})
const Lesnek = Schema.struct({ name: Schema.string })
const Standa = Schema.record(
  Schema.string,
  Schema.union(Schema.string, Schema.number)
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
  Api.setResponseBody(Schema.string),
  Api.setRequestQuery(Lesnek),
  Api.setSecurity(Security.bearer({ name: "myAwesomeBearerAuth", bearerFormat: "JWT" }))
)

const api = pipe(
  Api.make({ title: "My awesome pets API", version: "1.0.0" }),
  Api.addEndpoint(getLesnek),
  Api.addEndpoint(
    Api.get("getMilan", "/milan").pipe(Api.setResponseBody(Schema.string))
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
      Api.setResponseBody(Schema.string),
      Api.setRequestBody(Schema.struct({ zdar: Schema.literal("zdar") }))
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
