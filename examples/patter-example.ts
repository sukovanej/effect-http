import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "../src";

const api = pipe(
  Http.api({ title: "My awesome pets API", version: "1.0.0" }),
  Http.get("test", "/test", {
    response: Schema.string,
    query: Schema.struct({
      value: pipe(Schema.string, Schema.pattern(/[A-Z]/)),
    }),
  }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("test", () => Effect.succeed("test")),
);

pipe(server, Http.listen(4000), Effect.runPromise);
