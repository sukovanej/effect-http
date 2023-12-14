import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api } from "effect-http";

import { simpleApi1 } from "./example-apis";

test("fillDefaultSchemas", () => {
  expect(simpleApi1.endpoints).toHaveLength(1);
});

test("Attempt to declare duplicate operation id should fail as a safe guard", () => {
  const api = pipe(
    Api.api(),
    Api.put("myOperation", "/my-operation", { response: Schema.string }),
  );

  expect(() =>
    pipe(
      api,
      Api.post("myOperation", "/my-operation", { response: Schema.string }),
    ),
  ).toThrowError();

  const apiGroup = pipe(
    Api.apiGroup("group"),
    Api.patch("myOperation", "/my-operation", { response: Schema.string }),
  );

  expect(() =>
    pipe(
      apiGroup,
      Api.patch("myOperation", "/my-operation", { response: Schema.string }),
    ),
  ).toThrowError();

  expect(() => pipe(api, Api.addGroup(apiGroup))).toThrowError();
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
] as const)(
  "Api path must match param schemas (%#)",
  ({ expectFailure, path, schema }) => {
    const createApi = () =>
      pipe(
        Api.api(),
        Api.get("hello", path, {
          response: Schema.string,
          request: { ...(schema && { params: schema }) },
        }),
      );

    if (expectFailure) {
      expect(createApi).toThrowError();
    } else {
      createApi();
    }
  },
);
