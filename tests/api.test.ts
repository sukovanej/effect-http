import { simpleApi1 } from "./example-apis";

test("fillDefaultSchemas", () => {
  expect(simpleApi1.endpoints).toHaveLength(1);
});
