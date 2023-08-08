import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as Schema from "@effect/schema/Schema";
import * as Http from "effect-http";

import { runTestEffect } from "./utils";

const api = pipe(
  Http.api(),
  Http.get("getValue", "/get-value", { response: Schema.number }),
);

test("random example", async () => {
  const client = Http.mockClient(api);
  const response = await runTestEffect(client.getValue({}));

  expect(typeof response).toEqual("number");
});

test("custom response", async () => {
  const client = Http.mockClient(api, { responses: { getValue: 12 } });
  const response = await runTestEffect(client.getValue({}));

  expect(response).toEqual(12);
});

test("response schema with `optionFromNullable`", async () => {
  const MySchema = Schema.struct({
    value: Schema.optionFromNullable(Schema.string),
  });

  const api = Http.api().pipe(
    Http.post("test", "/test", {
      response: MySchema,
    }),
  );

  const client = Http.mockClient(api);
  const response = await runTestEffect(client.test());

  expect(Option.isOption(response.value)).toBe(true);
});
