import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import * as Http from "effect-http";

const api = pipe(
  Http.api({ title: "My api" }),
  Http.get("stuff", "/stuff", {
    response: Schema.string,
    request: {
      query: Schema.struct({ value: Schema.string }),
    },
  }),
);

type Api = typeof api;

// Notice query has type { readonly value: string; }
const handleStuff = ({ query }: Http.Input<Api, "stuff">) =>
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

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
