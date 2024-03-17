import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const SchemaBooleanFromString = Schema.transformLiterals(["true", true], ["false", false])

export const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("userById", "/api/users/:userId").pipe(
      Api.setResponseBody(Schema.struct({ name: Schema.string })),
      Api.setRequestPath(Schema.struct({ userId: Schema.string })),
      Api.setRequestQuery(
        Schema.struct({ include_deleted: Schema.optional(SchemaBooleanFromString) })
      ),
      Api.setRequestHeaders(Schema.struct({ authorization: Schema.string }))
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
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
