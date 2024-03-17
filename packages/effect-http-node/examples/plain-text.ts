import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, Representation, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"
import { PrettyLogger } from "effect-log"

export const api = Api.make({ title: "Example API" }).pipe(
  Api.addEndpoint(
    Api.get("root", "/").pipe(
      Api.setResponseBody(Schema.unknown),
      Api.setResponseRepresentations([Representation.plainText, Representation.json])
    )
  )
)

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("root", () => Effect.succeed({ content: { hello: "world" }, status: 200 as const })),
  RouterBuilder.build
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer()),
  NodeRuntime.runMain
)
