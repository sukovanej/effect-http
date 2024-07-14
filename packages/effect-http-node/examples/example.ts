import { Schema } from "@effect/schema"
import { Effect, Layer, Logger, LogLevel } from "effect"
import { Api, Handler, Middlewares, RouterBuilder, Security } from "effect-http"

import { HttpApp, HttpMiddleware, HttpRouter, HttpServer } from "@effect/platform"
import { NodeRuntime } from "@effect/platform-node"
import { NodeServer } from "effect-http-node"
import { get } from "http"

class StuffService extends Effect.Tag("@services/StuffService")<StuffService, {
  value: number
}>() {
  static dummy = Layer.succeed(this, this.of({ value: 42 }))
}

const HumanSchema = Schema.Struct({
  height: Schema.Number,
  name: Schema.String
})
const Lesnek = Schema.Struct({ name: Schema.String })
const Standa = Schema.Record(
  Schema.String,
  Schema.Union(Schema.String, Schema.Number)
)

const getLesnekEndpoint = Api.get("getLesnek", "/lesnek").pipe(
  Api.setResponseBody(Schema.String),
  Api.setRequestQuery(Lesnek),
  Api.setSecurity(Security.bearer({ name: "myAwesomeBearerAuth", bearerFormat: "JWT" }))
)
const getMilanEndpoint = Api.get("getMilan", "/milan").pipe(Api.setResponseBody(Schema.String))
const testEndpoint = Api.get("test", "/test").pipe(Api.setResponseBody(Standa), Api.setRequestQuery(Lesnek))
const standaEndpoint = Api.post("standa", "/standa").pipe(Api.setResponseBody(Standa), Api.setRequestBody(Standa))
const handleMilanEndpoint = Api.post("handleMilan", "/petr").pipe(
  Api.setResponseBody(HumanSchema),
  Api.setRequestBody(HumanSchema)
)
const callStandaEndpoint = Api.put("callStanda", "/api/zdar").pipe(
  Api.setResponseBody(Schema.String),
  Api.setRequestBody(Schema.Struct({ zdar: Schema.Literal("zdar") }))
)

const api = Api.make({ title: "My awesome pets API", version: "1.0.0" }).pipe(
  Api.addEndpoint(getLesnekEndpoint),
  Api.addEndpoint(getMilanEndpoint),
  Api.addEndpoint(testEndpoint),
  Api.addEndpoint(standaEndpoint),
  Api.addEndpoint(handleMilanEndpoint),
  Api.addEndpoint(callStandaEndpoint)
)

const getLesnekHandler = Handler.make(getLesnekEndpoint, ({ query }) =>
  Effect.succeed(`hello ${query.name}`).pipe(
    Effect.tap(() => Effect.logDebug("hello world"))
  ))
const handleMilanHandler = Handler.make(handleMilanEndpoint, ({ body }) =>
  Effect.map(StuffService, ({ value }) => ({
    ...body,
    randomValue: body.height + value
  })))
const getMilanHandler = Handler.make(getMilanEndpoint, () => Effect.succeed("Milan"))
const testHandler = Handler.make(testEndpoint, ({ query }) => Effect.succeed(query))
const standaHandler = Handler.make(standaEndpoint, ({ body }) => Effect.succeed(body))
const callStandaHandler = Handler.make(callStandaEndpoint, ({ body }) => Effect.succeed(body.zdar))

const app = RouterBuilder.make(api, { parseOptions: { errors: "all" } }).pipe(
  RouterBuilder.handle(getLesnekHandler),
  RouterBuilder.handle(handleMilanHandler),
  RouterBuilder.handle(getMilanHandler),
  RouterBuilder.handle(testHandler),
  RouterBuilder.handle(standaHandler),
  RouterBuilder.handle(callStandaHandler),
  RouterBuilder.build
)

app.pipe(
  Middlewares.accessLog(LogLevel.Debug),
  NodeServer.listen({ port: 4000 }),
  Effect.provide(StuffService.dummy),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
