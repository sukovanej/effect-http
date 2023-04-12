import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

const api = pipe(
  Http.api(),
  Http.get("stuff", "/stuff", {
    response: S.string,
    query: S.struct({ value: S.string }),
  }),
);

const handleStuff = ({ query }: Http.Input<typeof api, "stuff">) =>
  Effect.succeed("test");

const server = pipe(
  api,
  Http.server("My api"),
  Http.handle("stuff", handleStuff),
  Http.exhaustive,
);
