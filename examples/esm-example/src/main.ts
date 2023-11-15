import { Effect } from "effect";
import { NodeServer } from "effect-http";
import { PrettyLogger } from "effect-log";

import { ItemRepositoryInMemory } from "./repository.js";
import { app } from "./server.js";

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer()),
  Effect.provide(ItemRepositoryInMemory),
);

Effect.runPromise(program);
