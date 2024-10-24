import { HttpServer } from "@effect/platform"
import { BunContext, BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer, Logger, pipe, Schema } from "effect"
import { Api, Handler, RouterBuilder } from "effect-http"
import { NodeSwaggerFiles } from "effect-http-node"

const Response = Schema.Struct({
  name: Schema.String,
  id: pipe(Schema.Number, Schema.int(), Schema.positive())
})
const Query = Schema.Struct({ id: Schema.NumberFromString })

const getUserEndpoint = Api.get("getUser", "/user").pipe(
  Api.setResponseBody(Response),
  Api.setRequestQuery(Query)
)

const getUserHandler = Handler.make(getUserEndpoint, ({ query }) => Effect.succeed({ name: "milan", id: query.id }))

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(getUserEndpoint)
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle(getUserHandler),
  RouterBuilder.build
)

const server = pipe(
  HttpServer.serve(app),
  HttpServer.withLogAddress,
  Layer.provide(NodeSwaggerFiles.SwaggerFilesLive),
  Layer.provide(BunHttpServer.layer({ port: 3000 })),
  Layer.provide(BunContext.layer),
  Layer.provide(Logger.pretty),
  Layer.launch
)

BunRuntime.runMain(server)
