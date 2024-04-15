import { Schema } from "@effect/schema"
import { Either, identity, pipe } from "effect"
import { formatParseError } from "effect-http/internal/formatParseError"
import { apply } from "effect/Function"
import { describe, expect, test } from "vitest"

const expectError = <E>(self: Either.Either<unknown, E>): E =>
  Either.match(self, {
    onLeft: identity,
    onRight: () => {
      throw new Error("expected error")
    }
  })

const evaluate = (value: unknown) => (schema: Schema.Schema<any>) =>
  pipe(Schema.decodeUnknownEither(schema)(value), expectError, formatParseError)

describe("struct", () => {
  test("simple string", () => {
    const errors = pipe(
      Schema.Struct({ name: Schema.String }),
      evaluate({ name: 1 })
    )

    expect(errors).toEqual("name must be a string, received 1")
  })

  test("simple number", () => {
    const errors = pipe(
      Schema.Struct({ name: Schema.String, id: Schema.Number }),
      evaluate({ name: "name", id: "id" })
    )

    expect(errors).toEqual("id must be a number, received \"id\"")
  })

  test("missing", () => {
    const errors = pipe(
      Schema.Struct({ name: Schema.String, id: Schema.Number }),
      evaluate({ nameWrong: "name", id: "id" })
    )

    expect(errors).toEqual("name is missing")
  })

  test("nested", () => {
    const errors = pipe(
      Schema.Struct({
        name: Schema.String,
        users: Schema.Array(Schema.Struct({ value: Schema.String }))
      }),
      evaluate({
        name: "name",
        users: [{ value: "string" }, { value: { x: 1 } }]
      })
    )

    expect(errors).toEqual("users[1].value must be a string, received {\"x\":1}")
  })

  test("union", () => {
    const errors = pipe(
      Schema.Struct({
        name: Schema.String,
        users: Schema.Array(
          Schema.Struct({
            value: Schema.Union(Schema.Literal(1), Schema.Literal("zdar"))
          })
        )
      }),
      evaluate({
        name: "name",
        users: [{ value: "patrik" }]
      })
    )

    expect(errors).toEqual(
      "users[0].value must be 1 or \"zdar\", received \"patrik\""
    )
  })

  test("object", () => {
    const errors = pipe(Schema.Struct({ foo: Schema.String }), evaluate(null))

    expect(errors).toEqual("value must be an object, received null")
  })
})

test("pattern", () => {
  const errors = pipe(
    Schema.Struct({
      name: Schema.String,
      users: Schema.Array(
        Schema.Struct({
          value: pipe(Schema.String, Schema.pattern(/^[a-zA-Z]{2}$/))
        })
      )
    }),
    evaluate({
      name: "name",
      users: [{ value: "abc" }]
    })
  )

  expect(errors).toEqual(
    "users[0].value must be a string matching the pattern ^[a-zA-Z]{2}$, received \"abc\""
  )
})

const getErrorOrThrow = <From, To>(
  schema: Schema.Schema<To, From>,
  value: unknown
) =>
  pipe(
    Schema.decodeUnknownEither(schema),
    apply(value),
    Either.flip,
    Either.getOrThrow,
    formatParseError
  )

describe("formatSchemaErrors", () => {
  test("struct", () => {
    const schema = Schema.Struct({ userName: Schema.String })

    expect(getErrorOrThrow(schema, {})).toEqual("userName is missing")
    expect(getErrorOrThrow(schema, { userName: 1 })).toEqual(
      "userName must be a string, received 1"
    )
  })

  test("nested struct", () => {
    const schema = Schema.Struct({
      field: Schema.Struct({
        another: Schema.String
      })
    })

    expect(getErrorOrThrow(schema, { field: {} })).toEqual(
      "field.another is missing"
    )
    expect(getErrorOrThrow(schema, { field: { another: 69 } })).toEqual(
      "field.another must be a string, received 69"
    )
  })

  test("nested struct with union of structs", () => {
    const schema = Schema.Struct({
      field: Schema.Union(
        Schema.Struct({
          another: Schema.String
        }),
        Schema.Struct({
          value: Schema.Number
        })
      )
    })

    expect(getErrorOrThrow(schema, { field: {} })).toEqual(
      "field.another is missing"
    )
    expect(getErrorOrThrow(schema, { field: { value: "value" } })).toEqual(
      "field.value must be a number, received \"value\""
    )
  })

  test("index", () => {
    const schema = Schema.Struct({
      field: Schema.Array(
        Schema.NullOr(Schema.Struct({ another: Schema.Number }))
      )
    })

    expect(getErrorOrThrow(schema, { field: [null, null, {}] })).toEqual(
      "field[2].another is missing"
    )

    expect(
      getErrorOrThrow(schema, { field: [null, { another: null }] })
    ).toEqual("field[1].another must be a number, received null")
  })

  test("index with literal", () => {
    const schema = Schema.Struct({
      field: Schema.Array(
        Schema.NullOr(
          Schema.Struct({ another: Schema.Literal("a", "b", "c") })
        )
      )
    })

    expect(
      getErrorOrThrow(schema, { field: [null, { another: null }] })
    ).toEqual("field[1].another must be \"a\", \"b\" or \"c\", received null")
  })

  test("struct with literal", () => {
    const schema = Schema.Struct({ patrik: Schema.Literal("kure", "dominik") })

    expect(getErrorOrThrow(schema, {})).toEqual("patrik is missing")
    expect(getErrorOrThrow(schema, { patrik: 1 })).toEqual(
      "patrik must be \"kure\" or \"dominik\", received 1"
    )
  })

  test("literal", () => {
    const schema1 = Schema.Literal("a", "b")

    expect(getErrorOrThrow(schema1, "c")).toEqual(
      "value must be \"a\" or \"b\", received \"c\""
    )

    const schema2 = Schema.Literal("a", "b", "c")

    expect(getErrorOrThrow(schema2, "d")).toEqual(
      "value must be \"a\", \"b\" or \"c\", received \"d\""
    )
  })

  test("integers", () => {
    expect(getErrorOrThrow(Schema.Int, 2.3)).toEqual(
      "value must be an integer, received 2.3"
    )
    expect(getErrorOrThrow(Schema.Int.pipe(Schema.positive({ description: "a positive integer" })), -69)).toEqual(
      "value must be a positive integer, received -69"
    )
  })
})

describe("tuple", () => {
  test("missing", () => {
    const errors = pipe(
      Schema.Struct({
        hello: Schema.Tuple(Schema.String, Schema.Tuple(Schema.String))
      }),
      evaluate({
        hello: ["a", []]
      })
    )

    expect(errors).toEqual("hello[1][0] is missing")
  })
})
