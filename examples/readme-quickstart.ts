import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const responseSchema = Schema.struct({
  name: Schema.string,
  id: pipe(Schema.number, Schema.int(), Schema.positive()),
});
const querySchema = { id: Schema.NumberFromString };

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

const callServer = () =>
  pipe(
    client.getUser({ query: { id: 12 } }),
    Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
  );

pipe(
  server,
  Http.listen({ port: 3000, onStart: callServer }),
  Effect.runPromise,
);
