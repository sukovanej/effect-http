import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, pipe, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const SchemaBooleanFromString = Schema.transformLiterals(["true", true], ["false", false])

export const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("userById", "/api/users/:userId").pipe(
      Api.setResponseBody(Schema.Struct({ name: Schema.String })),
      Api.setRequestPath(Schema.Struct({ userId: Schema.String })),
      Api.setRequestQuery(
        Schema.Struct({ include_deleted: Schema.optional(SchemaBooleanFromString) })
      ),
      Api.setRequestHeaders(Schema.Struct({ authorization: Schema.String }))
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("userById", ({ query: { include_deleted } }) =>
    Effect.succeed({
      name: `include_deleted = ${include_deleted ?? "[not set]"}`
    })),
  RouterBuilder.build
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
