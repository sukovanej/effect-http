import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

export const simpleApi1 = pipe(
  Http.api(),
  Http.get("myOperation", "/get", { response: Schema.string }),
);

export const ALL_APIS = [simpleApi1];
