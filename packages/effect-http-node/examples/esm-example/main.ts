import { Effect, Logger } from "effect"
import { NodeServer } from "effect-http-node"

import { NodeRuntime } from "@effect/platform-node"
import { ItemRepositoryInMemory } from "./repository.js"
import { app } from "./server.js"

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Effect.provide(ItemRepositoryInMemory)
)

NodeRuntime.runMain(program)
