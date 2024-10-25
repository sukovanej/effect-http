import { NodeRuntime } from "@effect/platform-node"
import { Context, Effect, pipe, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

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
  Api.make(),
  Api.addEndpoint(
    Api.get("test", "/test").pipe(Api.setResponseBody(Schema.String))
  )
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
  NodeRuntime.runMain
)
