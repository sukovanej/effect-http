import { Schema } from "@effect/schema";
import { Effect, Either, pipe } from "effect";
import { Api, RouterBuilder, ServerError, Testing } from "effect-http";

import { runTestEffect } from "./utils";

const helloApi = pipe(
  Api.api(),
  Api.get("ping", "/ping", {
    response: Schema.literal("pong"),
  }),
  Api.get("hello", "/hello", {
    response: Schema.string,
  }),
);

test("basic auth", async () => {
  const app = pipe(
    RouterBuilder.make(helloApi),
    RouterBuilder.handle("ping", () => Effect.succeed("pong" as const)),
    RouterBuilder.handle("hello", () => Effect.succeed("test")),
    // Http.RouterBuilder.addExtension(
    //   Http.basicAuthExtension(({ user, password }) => {
    //     if (user === "mike" && password === "the-stock-broker") {
    //       return Effect.unit;
    //     }

    //     return Effect.fail("wrong credentials");
    //   }),
    //   { skipOperations: ["ping"] },
    // ),
    // Http.exhaustive,
    RouterBuilder.build,
  );

  const incorrectCredentials = Buffer.from("user:password").toString("base64");
  const correctCredentials = Buffer.from("mike:the-stock-broker").toString(
    "base64",
  );

  const result = await pipe(
    Testing.make(app, helloApi),
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
    Either.left(ServerError.unauthorizedError("wrong credentials")),
    Either.right("test"),
    Either.right("pong"),
  ]);
});
