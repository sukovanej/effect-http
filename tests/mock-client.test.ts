import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api(),
  Http.get("getValue", "/get-value", { response: Schema.number }),
);

test("random example", async () => {
  const client = pipe(api, Http.mockClient());

  await pipe(
    client.getValue({}),
    Effect.map((response) => {
      expect(typeof response).toEqual("number");
    }),
    Effect.runPromise,
  );
});

test("custom response", async () => {
  const client = pipe(api, Http.mockClient({ responses: { getValue: 12 } }));

  await pipe(
    client.getValue({}),
    Effect.map((response) => {
      expect(response).toEqual(12);
    }),
    Effect.runPromise,
  );
});
