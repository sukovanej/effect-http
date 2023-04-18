import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

const api = pipe(
  Http.api({ title: "My api" }),
  Http.get("stuff", "/stuff", {
    response: S.string,
    query: { value: S.string },
  }),
);

const handleStuff = ({ query }: Http.Input<typeof api, "stuff">) =>
  pipe(
    Effect.fail(Http.notFoundError("I didnt find it")),
    Effect.tap(() => Effect.log(`Received ${query.value}`)),
  );

const server = pipe(
  api,
  Http.server,
  Http.handle("stuff", handleStuff),
  Http.exhaustive,
);

pipe(server, Http.listen(3000), Effect.runPromise);
