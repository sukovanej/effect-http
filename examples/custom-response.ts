import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import * as Http from "effect-http";

const api = pipe(
  Http.api(),
  Http.get("hello", "/hello", {
    response: {
      status: 201,
      headers: Schema.struct({
        "X-Hello-World": Schema.string,
      }),
      content: Schema.number,
    },
  }),
);

const server = pipe(
  Http.server(api),
  Http.handle("hello", ({ ResponseUtil }) =>
    Effect.succeed(
      ResponseUtil.response201({
        content: 12,
        headers: { "x-hello-world": "test" },
      }),
    ),
  ),
);

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
