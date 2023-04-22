import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

import { simpleApi1 } from "./example-apis";

test("example server", () => {
  const server = Http.exampleServer(simpleApi1);

  pipe(
    server,
    Http.listen(),
    Effect.flatMap(({ port }) =>
      pipe(
        simpleApi1,
        Http.client(new URL(`http://localhost:${port}`)),
        (client) => client.myOperation({}),
      ),
    ),
    Effect.map((response) => {
      expect(typeof response).toEqual("string");
    }),
    Effect.runPromise,
  );
});
