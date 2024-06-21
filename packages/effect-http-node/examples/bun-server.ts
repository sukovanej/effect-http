import { HttpServer } from "@effect/platform"
import { BunContext, BunHttpServer } from "@effect/platform-bun"
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Layer, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeSwaggerFiles } from "effect-http-node"

const Response = Schema.Struct({
  name: Schema.String,
  id: pipe(Schema.Number, Schema.int(), Schema.positive())
})
const Query = Schema.Struct({ id: Schema.NumberFromString })

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user").pipe(
      Api.setResponseBody(Response),
      Api.setRequestQuery(Query)
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: "milan", id: query.id })),
  RouterBuilder.build
)

const server = pipe(
  HttpServer.serve(app),
  Layer.provide(NodeSwaggerFiles.SwaggerFilesLive),
  Layer.provide(BunHttpServer.layer({ port: 3000 })),
  Layer.provide(BunContext.layer),
  Layer.launch,
  Effect.scoped
)

NodeRuntime.runMain(server)
