import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api({ title: "My api" }),
  Http.get("stuff", "/stuff", {
    response: Schema.string,
    query: { value: Schema.string },
  }),
  Http.basicAuth,
);

// Notice query has type { readonly value: string; }
const handleStuff = ({ query }: Http.Input<typeof api, "stuff">) =>
  pipe(
    Effect.succeed(`Hello, number ${query.value}`),
    Effect.tap(() => Effect.log(`Received ${query.value}`)),
  );

const server = pipe(
  api,
  Http.server,
  Http.handle("stuff", handleStuff),
  Http.exhaustive,
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideLayer(Http.basicAuthStaticConfigProvider),
  Effect.runPromise,
);

/**
 * run with `CREDENTIALS=user1:pass1,patrik:standa pnpm tsx examples/basic-auth.ts`
 * - VALID:  curl localhost:3000/stuff\?value=69 -H 'Authorization: Basic dXNlcjE6cGFzczE='
 * - VALID:  curl localhost:3000/stuff\?value=420 -H 'Authorization: Basic cGF0cmlrOnN0YW5kYQ=='
 * - INVALID curl localhost:3000/stuff\?value=1 -H 'Authorization: cGF0cmlrOnN0YW5kYQ=='
 * - INVALID curl localhost:3000/stuff\?value=1 -H 'Authorization: Basic aW52YWxpZC1jcmVkZW50aWFscw=='
 */
