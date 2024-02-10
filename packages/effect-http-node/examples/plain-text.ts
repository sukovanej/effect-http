import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, Representation, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"
import { PrettyLogger } from "effect-log"

export const api = Api.api({ title: "Example API" }).pipe(
  Api.get("root", "/", {
    response: {
      content: Schema.unknown,
      status: 200,
      representations: [Representation.plainText, Representation.json]
    }
  })
)

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("root", () => Effect.succeed({ content: { hello: "world" }, status: 200 as const })),
  RouterBuilder.build
)

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer())
)

NodeRuntime.runMain(program)
