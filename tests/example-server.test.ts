import { Effect, pipe } from "effect";
import { ExampleServer, RouterBuilder, Testing } from "effect-http";

import { simpleApi1 } from "./example-apis";
import { exampleApiFullResponse } from "./examples";
import { runTestEffect } from "./utils";

test("example server", async () => {
  const app = ExampleServer.make(simpleApi1);

  await pipe(
    Testing.make(RouterBuilder.build(app), simpleApi1),
    Effect.flatMap((client) => client.myOperation({})),
    Effect.map((response) => {
      expect(typeof response).toEqual("string");
    }),
    runTestEffect,
  );
});

test("handle", async () => {
  const app = RouterBuilder.make(exampleApiFullResponse).pipe(
    RouterBuilder.handle("another", () =>
      Effect.succeed({
        status: 200 as const,
        content: 69,
      }),
    ),
    ExampleServer.handle("hello"),
  );

  const response = await pipe(
    Testing.make(RouterBuilder.build(app), exampleApiFullResponse),
    Effect.flatMap((client) => client.hello({})),
    runTestEffect,
  );

  expect(response.status).toEqual(200);
  expect(typeof response.content).toEqual("number");
  expect(typeof response.headers["my-header"]).toEqual("string");
});

test("handleRemaining", async () => {
  const app = RouterBuilder.make(exampleApiFullResponse).pipe(
    RouterBuilder.handle("another", () =>
      Effect.succeed({
        status: 200 as const,
        content: 69,
      }),
    ),
    ExampleServer.handleRemaining,
  );

  const response = await pipe(
    Testing.make(RouterBuilder.build(app), exampleApiFullResponse),
    Effect.flatMap((client) => client.hello({})),
    runTestEffect,
  );

  expect(response.status).toEqual(200);
  expect(typeof response.content).toEqual("number");
  expect(typeof response.headers["my-header"]).toEqual("string");
});
