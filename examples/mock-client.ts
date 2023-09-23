import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import * as Http from "effect-http";

export const exampleApiGet = Http.api().pipe(
  Http.get("getValue", "/get-value", { response: Schema.number }),
);

const client = Http.mockClient(exampleApiGet);

const program = pipe(
  client.getValue({}),
  Effect.tap(Effect.log),
  Effect.scoped,
);

Effect.runPromise(program);
