import { Effect, ReadonlyArray, pipe } from "effect";
import { Client } from "effect-http";

import { api } from "../examples/headers";

// Example client triggering the API from `examples/headers.ts`
// Running the script call the `/hello` endpoint 1000k times

const client = Client.client(api, {
  baseUrl: new URL("http://localhost:3000"),
});

pipe(
  Effect.all(
    pipe(
      client.hello({ body: { value: 1 }, headers: { "x-client-id": "abc" } }),
      Effect.flatMap((r) => Effect.logInfo(`Success ${r}`)),
      Effect.catchAll((e) => Effect.logInfo(`Error ${JSON.stringify(e)}`)),
      ReadonlyArray.replicate(1000000),
    ),
  ),
  Effect.runPromise,
);
