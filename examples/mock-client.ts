import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, MockClient } from "effect-http";

export const exampleApiGet = Api.api().pipe(
  Api.get("getValue", "/get-value", { response: Schema.number }),
);

const client = MockClient.make(exampleApiGet);

const program = pipe(
  client.getValue({}),
  Effect.tap(Effect.log),
  Effect.scoped,
);

Effect.runPromise(program);
