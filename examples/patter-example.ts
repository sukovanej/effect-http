import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api({ title: "My awesome pets API", version: "1.0.0" }),
  Http.get("test", "/test", {
    response: Schema.string,
    query: {
      value: pipe(Schema.string, Schema.pattern(/[A-Z]/)),
    },
  }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("test", ({ query }) => Effect.succeed(`test ${query.value}`)),
);

pipe(server, Http.listen({ port: 4000 }), Effect.runPromise);
