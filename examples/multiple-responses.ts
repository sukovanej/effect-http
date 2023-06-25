import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const api = pipe(
  Http.api(),
  Http.get("hello", "/hello", {
    response: [
      {
        status: 201,
        content: Schema.number,
      },
      {
        status: 200,
        content: Schema.number,
        headers: { "X-Another-200": Schema.NumberFromString },
      },
      {
        status: 204,
        headers: { "X-Another": Schema.NumberFromString },
      },
    ],
  }),
);

type R = (typeof api)["endpoints"][0]["schemas"]['response'];
type X = Http.HandlerResponse<R>;

const server = pipe(
  Http.server(api),
  Http.handle("hello", () =>
    Effect.succeed({
      status: 201 as const,
      content: 12,
    }),
  ),
);

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
