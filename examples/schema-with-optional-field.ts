import * as Schema from "@effect/schema/Schema";
import { Effect, Option, pipe } from "effect";
import * as Http from "effect-http";

const Response = Schema.struct({
  foo: Schema.optional(Schema.string).toOption(),
  bar: Schema.option(Schema.string),
});

const api = pipe(
  Http.api(),
  Http.get("hello", "/hello", {
    response: Response,
  }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("hello", () =>
    Effect.succeed({ foo: Option.none(), bar: Option.none() }),
  ),
  Http.exhaustive,
);

pipe(server, Http.listen({ port: 4000 }), Effect.runPromise);
