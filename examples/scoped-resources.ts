import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Context, Effect, pipe } from "effect"
import { Api, NodeServer, RouterBuilder } from "effect-http"

import { debugLogger } from "./_utils.js"

interface Resource {
  value: number
}

const ResourceService = Context.GenericTag<Resource>("@services/ResourceService")

const resource = Effect.acquireRelease(
  pipe(
    Effect.log("Acquried resource"),
    Effect.as({ value: 2 } satisfies Resource)
  ),
  () => Effect.log("Released resource")
)

const api = pipe(
  Api.api(),
  Api.get("test", "/test", { response: Schema.string })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("test", () => Effect.map(ResourceService, ({ value }) => `There you go: ${value}`)),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provideServiceEffect(ResourceService, resource),
  Effect.scoped,
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
