import * as Log from "effect-log";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

const responseSchema = S.struct({ name: S.string });
const querySchema = S.struct({ id: S.NumberFromString });

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
  Http.handle("getUser", ({ query }) => Effect.succeed({ name: "milan" })),
  Http.exhaustive,
);

const client = pipe(api, Http.client(new URL("http://localhost:3000")));

pipe(
  server,
  Http.setLogger(Log.pretty),
  Http.listen(3000),
  Effect.flatMap(() => client.getUser({ query: { id: 12 } })),
  Effect.flatMap((user) => Effect.logInfo(`Got ${user.name}, nice!`)),
  Effect.provideLayer(Log.usePrettyLogger),
  Effect.runPromise,
);
