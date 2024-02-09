import { Schema } from "@effect/schema"
import { Context, Effect, Layer, pipe } from "effect"
import { Api, NodeServer, RouterBuilder } from "effect-http"

import { NodeRuntime } from "@effect/platform-node"
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

const StuffService = Context.GenericTag<{ value: number }>("@services/StuffService")

const dummyStuff = pipe(
  Effect.succeed({ value: 42 }),
  Layer.effect(StuffService)
)

// Api

const api = pipe(
  Api.api({ title: "My awesome pets API", version: "1.0.0" }),
  Api.get("getMilan", "/milan", { response: Schema.string }),
  Api.get("getLesnek", "/lesnek", {
    response: Schema.string,
    request: {
      query: Lesnek
    }
  }),
  Api.get("test", "/test", {
    response: Standa,
    request: { query: Lesnek }
  }),
  Api.post("standa", "/standa", {
    response: Standa,
    request: {
      body: Standa
    }
  }),
  Api.post("handleMilan", "/petr", {
    response: HumanSchema,
    request: {
      body: HumanSchema
    }
  }),
  Api.put("callStanda", "/api/zdar", {
    response: Schema.string,
    request: {
      body: Schema.struct({ zdar: Schema.literal("zdar") })
    }
  })
)

const app = pipe(
  RouterBuilder.make(api, { parseOptions: { errors: "all" } }),
  RouterBuilder.handle("handleMilan", ({ body }) =>
    Effect.map(StuffService, ({ value }) => ({
      ...body,
      randomValue: body.height + value
    }))),
  RouterBuilder.handle("getMilan", () => Effect.succeed("test")),
  RouterBuilder.handle("test", ({ query: { name } }) => Effect.succeed({ name })),
  RouterBuilder.handle("standa", ({ body }) => Effect.succeed({ ...body, standa: "je borec" })),
  RouterBuilder.handle("getLesnek", ({ query }) =>
    pipe(
      Effect.succeed(`hello ${query.name}`),
      Effect.tap(() => Effect.logDebug("hello world"))
    )),
  RouterBuilder.handle("callStanda", () => Effect.succeed("zdar"))
)

pipe(
  RouterBuilder.build(app),
  NodeServer.listen({ port: 4000 }),
  Effect.provide(dummyStuff),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
