import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import * as Http from "effect-http";

const SchemaBooleanFromString = pipe(
  Schema.literal("true", "false"),
  Schema.transform(
    Schema.boolean,
    (i) => i === "true",
    (o) => (o ? "true" : "false"),
  ),
);

export const api = pipe(
  Http.api(),
  Http.get("userById", "/api/users/:userId", {
    response: Schema.struct({ name: Schema.string }),
    request: {
      params: Schema.struct({
        userId: Schema.string,
      }),
      query: Schema.struct({
        include_deleted: Schema.optional(SchemaBooleanFromString),
      }),
      headers: Schema.struct({
        authorization: Schema.string,
      }),
    },
  }),
);

const server = pipe(
  Http.server(api),
  Http.handle("userById", ({ query: { include_deleted } }) =>
    Effect.succeed({
      name: `include_deleted = ${include_deleted ?? "[not set]"}`,
    }),
  ),
  Http.listen({ port: 3000 }),
);

Effect.runPromise(server);
