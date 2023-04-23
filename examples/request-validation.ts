import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

export const api = pipe(
  Http.api({ title: "My api" }),
  Http.get("stuff", "/stuff/:param", {
    response: Schema.struct({ value: Schema.number }),
    body: Schema.struct({ bodyField: Schema.array(Schema.string) }),
    query: { query: Schema.string },
    params: { param: Schema.string },
  }),
);
