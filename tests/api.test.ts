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

test.each([
  {
    expectFailure: false,
    path: "/hello",
    schema: undefined,
  },
  {
    expectFailure: false,
    path: "/hello/:input",
    schema: Schema.struct({ input: Schema.string }),
  },
  {
    expectFailure: true,
    path: "/hello/:input?",
    schema: Schema.struct({ input: Schema.string }),
  },
  {
    expectFailure: true,
    path: "/hello",
    schema: Schema.struct({ input: Schema.string }),
  },
  {
    expectFailure: true,
    path: "/hello/:input",
    schema: undefined,
  },
  {
    expectFailure: false,
    path: "/hello/:input/another/:another",
    schema: Schema.struct({ input: Schema.string, another: Schema.string }),
  },
  {
    expectFailure: true,
    path: "/hello/:input/another/:another?",
    schema: Schema.struct({ input: Schema.string, another: Schema.string }),
  },
  {
    expectFailure: false,
    path: "/hello/:input/another/:another?",
    schema: Schema.struct({
      input: Schema.string,
      another: Schema.optional(Schema.string),
    }),
  },
])(
  "Api path must match param schemas (%#)",
  ({ expectFailure, path, schema }) => {
    const createApi = () =>
      pipe(
        Http.api(),
        Http.get("hello", path, {
          response: Schema.string,
          request: { params: schema },
        }),
      );

    if (expectFailure) {
      expect(createApi).toThrowError();
    } else {
      createApi();
    }
  },
);
