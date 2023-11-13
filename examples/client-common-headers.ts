import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, Client } from "effect-http";

const api = pipe(
  Api.api(),
  Api.get("test", "/test", {
    response: Schema.struct({ name: Schema.string }),
    headers: { AUTHORIZATION: Schema.string },
  }),
);

const client = Client.client(api, new URL("http://my-url"), {
  headers: {
    authorization: "Basic aGVsbG8gcGF0cmlrLCBob3cgYXJlIHlvdSB0b2RheQ==",
  },
});

// "x-my-header" can be provided to override the default but it's not necessary
pipe(client.test(), Effect.runPromise);
