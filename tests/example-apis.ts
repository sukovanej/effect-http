import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

export const simpleApi1 = pipe(
  Http.api(),
  Http.get("myOperation", "/get", { response: S.string }),
);

export const ALL_APIS = [simpleApi1];
