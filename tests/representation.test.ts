import { Representation } from "effect-http";

import { runTestEffect } from "./utils";

test.each([
  { input: "string", expected: "string" },
  { input: 69, expected: "69" },
  { input: 69.42, expected: "69.42" },
  { input: [12, "12"], expected: '[12,"12"]' },
  { input: { a: "b" }, expected: '{"a":"b"}' },
] as const)("plain text stringify $input", async ({ input, expected }) => {
  const result = await runTestEffect(Representation.plainText.stringify(input));

  expect(result).toEqual(expected);
});
