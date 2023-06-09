import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const responseSchema = pipe(
  Schema.struct({
    name: Schema.string,
    id: pipe(Schema.number, Schema.int(), Schema.positive()),
  }),
  Schema.description("User"),
);
const querySchema = {
  id: pipe(Schema.NumberFromString, Schema.description("User id")),
};

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.get(
    "getUser",
    "/user",
    {
      response: responseSchema,
      query: querySchema,
    },
    { description: "Returns a User by id" },
  ),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("getUser", ({ query }) =>
    Effect.succeed({ name: "mike", id: query.id }),
  ),
  Http.exhaustive,
);

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
