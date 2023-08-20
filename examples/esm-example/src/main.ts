import { Effect } from "effect";
import * as Http from "effect-http";
import * as Log from "effect-log";

import { ItemRepositoryInMemory } from "./repository.js";
import { server } from "./server.js";

const program = server.pipe(
  Http.listen({ port: 3000 }),
  Effect.provideSomeLayer(Log.setPrettyLogger()),
  Effect.provideLayer(ItemRepositoryInMemory),
);

Effect.runPromise(program);
