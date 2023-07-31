import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import * as Http from "effect-http";

import { runTestEffect, testServer } from "./utils";

const helloApi = pipe(
  Http.api(),
  Http.get("ping", "/ping", {
    response: Schema.literal("pong"),
  }),
  Http.get("hello", "/hello", {
    response: Schema.string,
  }),
);

test("basic auth", async () => {
  const server = pipe(
    helloApi,
    Http.server,
    Http.handle("ping", () => Effect.succeed("pong" as const)),
    Http.handle("hello", () => Effect.succeed("test")),
    Http.addExtension(
      Http.basicAuthExtension(({ user, password }) => {
        if (user === "mike" && password === "the-stock-broker") {
          return Effect.unit;
        }

        return Effect.fail("wrong credentials");
      }),
      { skipOperations: ["ping"] },
    ),
    Http.exhaustive,
  );

  const incorrectCredentials = Buffer.from("user:password").toString("base64");
  const correctCredentials = Buffer.from("mike:the-stock-broker").toString(
    "base64",
  );

  const result = await pipe(
    testServer(server),
    Effect.flatMap((client) =>
      Effect.all(
        [
          client.hello({
            headers: { Authorization: `Basic ${incorrectCredentials}` },
          }),
          client.hello({
            headers: { Authorization: `Basic ${correctCredentials}` },
          }),
          client.ping(),
        ].map(Effect.either),
      ),
    ),
    runTestEffect,
  );

  expect(result).toEqual([
    Either.left(
      Http.httpClientError(
        { error: "UnauthorizedError", details: "wrong credentials" },
        401,
      ),
    ),
    Either.right("test"),
    Either.right("pong"),
  ]);
});
