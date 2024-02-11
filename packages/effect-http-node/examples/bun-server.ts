import { HttpServer } from "@effect/platform"
import { BunContext, BunHttpServer } from "@effect/platform-bun"
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Layer, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeSwaggerFiles } from "effect-http-node"

const responseSchema = Schema.struct({
  name: Schema.string,
  id: pipe(Schema.number, Schema.int(), Schema.positive())
})
const querySchema = Schema.struct({ id: Schema.NumberFromString })

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get("getUser", "/user", {
    response: responseSchema,
    request: {
      query: querySchema
    }
  })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: "milan", id: query.id })),
  RouterBuilder.build
)

const server = pipe(
  HttpServer.server.serve(app),
  Layer.provide(NodeSwaggerFiles.SwaggerFilesLive),
  Layer.provide(BunHttpServer.server.layer({ port: 3000 })),
  Layer.provide(BunContext.layer),
  Layer.launch,
  Effect.scoped
)

NodeRuntime.runMain(server)
