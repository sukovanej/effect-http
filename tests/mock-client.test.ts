import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import * as Http from "effect-http";

import { runTestEffect } from "./utils";

const api = pipe(
  Http.api(),
  Http.get("getValue", "/get-value", { response: Schema.number }),
);

test("random example", async () => {
  const client = pipe(api, Http.mockClient());
  const response = await runTestEffect(client.getValue({}));

  expect(typeof response).toEqual("number");
});

test("custom response", async () => {
  const client = pipe(api, Http.mockClient({ responses: { getValue: 12 } }));
  const response = await runTestEffect(client.getValue({}));

  expect(response).toEqual(12);
});
