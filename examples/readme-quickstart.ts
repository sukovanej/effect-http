import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

const responseSchema = S.struct({ name: S.string, id: S.number });
const querySchema = { id: S.NumberFromString };

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.get("getUser", "/user", {
    response: responseSchema,
    query: querySchema,
  }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("getUser", ({ query }) =>
    Effect.succeed({ name: "milan", id: query.id }),
  ),
  Http.exhaustive,
);

const client = pipe(api, Http.client(new URL("http://localhost:3000")));

pipe(
  server,
  Http.listen(3000),
  Effect.flatMap(() => client.getUser({ query: { id: 12 } })),
  Effect.flatMap((user) => Effect.logInfo(`Got ${user.name}, nice!`)),
  Effect.runPromise,
);
