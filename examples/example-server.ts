import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import * as Http from "effect-http";

import { debugLogger } from "./_utils";

const responseSchema = Schema.struct({
  name: Schema.string,
  value: Schema.number,
});

const api = pipe(
  Http.api(),
  Http.get("test", "/test", { response: responseSchema }),
);

pipe(
  api,
  Http.exampleServer,
  Http.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.runPromise,
);
