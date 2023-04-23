import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const responseSchema = Schema.struct({ name: Schema.string });

const api = pipe(
  Http.api(),
  Http.get("test", "/test", { response: responseSchema }),
);

pipe(api, Http.exampleServer, Http.listen({ port: 3000 }), Effect.runPromise);
