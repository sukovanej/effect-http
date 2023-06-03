import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

import { simpleApi1 } from "./example-apis";

test("fillDefaultSchemas", () => {
  expect(simpleApi1.endpoints).toHaveLength(1);
});

test("Attempt to declare duplicate operation id should fail as a safe guard", () => {
  const api = pipe(
    Http.api(),
    Http.put("myOperation", "/my-operation", { response: Schema.string }),
  );

  expect(() =>
    pipe(
      api,
      Http.post("myOperation", "/my-operation", { response: Schema.string }),
    ),
  ).toThrowError();

  const apiGroup = pipe(
    Http.apiGroup("group"),
    Http.patch("myOperation", "/my-operation", { response: Schema.string }),
  );

  expect(() =>
    pipe(
      apiGroup,
      Http.patch("myOperation", "/my-operation", { response: Schema.string }),
    ),
  ).toThrowError();

  expect(() => pipe(api, Http.addGroup(apiGroup))).toThrowError();
});
