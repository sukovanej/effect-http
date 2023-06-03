import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const api = pipe(
  Http.api(),
  Http.get("hello", "/hello", { response: Schema.number }),
);

const server = pipe(
  Http.server(api),
  Http.handle("hello", () =>
    Effect.succeed(
      new Response(JSON.stringify(12), {
        status: 201,
        headers: { "X-Hello-World": "test" },
      }),
    ),
  ),
);

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
