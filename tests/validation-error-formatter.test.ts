import * as Either from "@effect/data/Either";
import { identity, pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

import { defaultValidationErrorFormatterServer } from "../src/Server/ValidationErrorFormatter";

const expectError = <E>(self: Either.Either<E, unknown>): E =>
  Either.match(self, identity, () => {
    throw new Error("expected error");
  });

const evaluate = (value: unknown) => (schema: Schema.Schema<any, any>) =>
  pipe(
    Schema.parseEither(schema)(value),
    expectError,
    defaultValidationErrorFormatterServer,
  );

describe("struct", () => {
  test("simple string", () => {
    const errors = pipe(
      Schema.struct({ name: Schema.string }),
      evaluate({ name: 1 }),
    );

    expect(errors).toEqual("name must be <string>, got 1");
  });

  test("simple number", () => {
    const errors = pipe(
      Schema.struct({ name: Schema.string, id: Schema.number }),
      evaluate({ name: "name", id: "id" }),
    );

    expect(errors).toEqual('id must be <number>, got "id"');
  });

  test("missing", () => {
    const errors = pipe(
      Schema.struct({ name: Schema.string, id: Schema.number }),
      evaluate({ nameWrong: "name", id: "id" }),
    );

    expect(errors).toEqual("name is missing");
  });

  test("nested", () => {
    const errors = pipe(
      Schema.struct({
        name: Schema.string,
        users: Schema.array(Schema.struct({ value: Schema.string })),
      }),
      evaluate({
        name: "name",
        users: [{ value: "string" }, { value: { x: 1 } }],
      }),
    );

    expect(errors).toEqual('users.[1].value must be <string>, got {"x":1}');
  });

  test("union", () => {
    const errors = pipe(
      Schema.struct({
        name: Schema.string,
        users: Schema.array(
          Schema.struct({
            value: Schema.union(Schema.literal(1), Schema.literal("zdar")),
          }),
        ),
      }),
      evaluate({
        name: "name",
        users: [{ value: "patrik" }],
      }),
    );

    expect(errors).toEqual(
      'users.[0].value must be one of 1 or "zdar", got "patrik"',
    );
  });
});

test("pattern", () => {
  const errors = pipe(
    Schema.struct({
      name: Schema.string,
      users: Schema.array(
        Schema.struct({
          value: pipe(Schema.string, Schema.pattern(/^[a-zA-Z]{2}$/)),
        }),
      ),
    }),
    evaluate({
      name: "name",
      users: [{ value: "abc" }],
    }),
  );

  expect(errors).toEqual(
    'users.[0].value must be a string matching the pattern ^[a-zA-Z]{2}$, got "abc"',
  );
});
