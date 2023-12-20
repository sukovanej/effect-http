import * as BunContext from "@effect/platform-bun/BunContext"
import * as Http from "@effect/platform-bun/HttpServer"
import { runMain } from "@effect/platform-bun/Runtime"
import { Schema } from "@effect/schema"
import { Effect, Layer, pipe } from "effect"
import { Api, RouterBuilder, SwaggerRouter } from "effect-http"

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
  Http.server.serve(app),
  Layer.provide(SwaggerRouter.SwaggerFilesLive),
  Layer.provide(Http.server.layer({ port: 3000 })),
  Layer.provide(BunContext.layer),
  Layer.launch,
  Effect.scoped
)

runMain(server)
