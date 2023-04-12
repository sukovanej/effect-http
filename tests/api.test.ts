import { simpleApi1 } from "./example-apis";

test("fillDefaultSchemas", () => {
  expect(simpleApi1).toHaveLength(1);
});
