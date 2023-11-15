import { runMain } from "@effect/platform-node/Runtime";
import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import { Api, NodeServer, RouterBuilder } from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Api.api(),
  Api.post("hello", "/hello", {
    response: [
      {
        status: 201,
        content: Schema.number,
      },
      {
        status: 200,
        content: Schema.number,
        headers: Schema.struct({
          "My-Header": pipe(
            Schema.NumberFromString,
            Schema.description("My header"),
          ),
        }),
      },
      {
        status: 204,
        headers: Schema.struct({ "X-Another": Schema.NumberFromString }),
      },
    ],
    request: {
      headers: Schema.struct({
        "User-Agent": pipe(
          Schema.NumberFromString,
          Schema.description("Identifier of the user"),
        ),
      }),
    },
  }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", () =>
    Effect.succeed({
      content: 12,
      headers: { "my-header": 69 },
      status: 201 as const,
    }),
  ),
  RouterBuilder.build,
);

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  runMain,
);
