import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

export const simpleApi1 = pipe(
  Http.api(),
  Http.get("myOperation", "/get", { response: Schema.string }),
);

export const ALL_APIS = [simpleApi1];
