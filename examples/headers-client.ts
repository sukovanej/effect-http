import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";

import * as Http from "effect-http";

import { api } from "../examples/headers";

// Example client triggering the API from `examples/headers.ts`
// Running the script call the `/hello` endpoint 1000k times

const client = pipe(api, Http.client(new URL("http://localhost:3000")));

pipe(
  client.hello({ body: { value: 1 }, headers: { "x-client-id": "abc" } }),
  Effect.flatMap((r) => Effect.log(`Success ${r}`)),
  Effect.catchAll((e) => Effect.log(`Error ${JSON.stringify(e)}`)),
  RA.replicate(1000000),
  Effect.all,
  Effect.runPromise,
);
