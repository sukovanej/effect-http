import { Effect, pipe } from "effect";
import { ExampleServer, RouterBuilder } from "effect-http";

import { simpleApi1 } from "./example-apis";
import { runTestEffect, testApp } from "./utils";

test("example server", async () => {
  const app = ExampleServer.make(simpleApi1);

  await pipe(
    RouterBuilder.build(app),
    testApp(simpleApi1),
    Effect.flatMap((client) => client.myOperation({})),
    Effect.map((response) => {
      expect(typeof response).toEqual("string");
    }),
    runTestEffect,
  );
});
