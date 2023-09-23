import { Effect, pipe } from "effect";
import * as Http from "effect-http";

import { simpleApi1 } from "./example-apis";
import { runTestEffect, testServer } from "./utils";

test("example server", async () => {
  const server = Http.exampleServer(simpleApi1);

  await pipe(
    testServer(server),
    Effect.flatMap((client) => client.myOperation({})),
    Effect.map((response) => {
      expect(typeof response).toEqual("string");
    }),
    runTestEffect,
  );
});
