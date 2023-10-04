import { Effect } from "effect";
import * as Http from "effect-http";
import { Log } from "effect-log";

import { ItemRepositoryInMemory } from "./repository.js";
import { server } from "./server.js";

const program = server.pipe(
  Http.listen({ port: 3000 }),
  Effect.provide(Log.setPrettyLogger()),
  Effect.provide(ItemRepositoryInMemory),
);

Effect.runPromise(program);
