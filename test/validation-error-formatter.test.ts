import { Schema } from "@effect/schema"
import { Either, identity, pipe } from "effect"
import { formatParseError } from "effect-http/internal/formatParseError"
import { apply } from "effect/Function"
import { describe, expect, test } from "vitest"

const expectError = <E>(self: Either.Either<E, unknown>): E =>
  Either.match(self, {
    onLeft: identity,
    onRight: () => {
      throw new Error("expected error")
    }
  })

const evaluate = (value: unknown) => (schema: Schema.Schema<never, any, any>) =>
  pipe(Schema.decodeUnknownEither(schema)(value), expectError, formatParseError)

describe("struct", () => {
  test("simple string", () => {
    const errors = pipe(
      Schema.struct({ name: Schema.string }),
      evaluate({ name: 1 })
    )

    expect(errors).toEqual("name must be a string, received 1")
  })

  test("simple number", () => {
    const errors = pipe(
      Schema.struct({ name: Schema.string, id: Schema.number }),
      evaluate({ name: "name", id: "id" })
    )

    expect(errors).toEqual("id must be a number, received \"id\"")
  })

  test("missing", () => {
    const errors = pipe(
      Schema.struct({ name: Schema.string, id: Schema.number }),
      evaluate({ nameWrong: "name", id: "id" })
    )

    expect(errors).toEqual("name is missing")
  })

  test("nested", () => {
    const errors = pipe(
      Schema.struct({
        name: Schema.string,
        users: Schema.array(Schema.struct({ value: Schema.string }))
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
      Schema.struct({
        name: Schema.string,
        users: Schema.array(
          Schema.struct({
            value: Schema.union(Schema.literal(1), Schema.literal("zdar"))
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
    const errors = pipe(Schema.struct({ foo: Schema.string }), evaluate(null))

    expect(errors).toEqual("value must be an object, received null")
  })
})

test("pattern", () => {
  const errors = pipe(
    Schema.struct({
      name: Schema.string,
      users: Schema.array(
        Schema.struct({
          value: pipe(Schema.string, Schema.pattern(/^[a-zA-Z]{2}$/))
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
  schema: Schema.Schema<never, From, To>,
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
    const schema = Schema.struct({ userName: Schema.string })

    expect(getErrorOrThrow(schema, {})).toEqual("userName is missing")
    expect(getErrorOrThrow(schema, { userName: 1 })).toEqual(
      "userName must be a string, received 1"
    )
  })

  test("nested struct", () => {
    const schema = Schema.struct({
      field: Schema.struct({
        another: Schema.string
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
    const schema = Schema.struct({
      field: Schema.union(
        Schema.struct({
          another: Schema.string
        }),
        Schema.struct({
          value: Schema.number
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
    const schema = Schema.struct({
      field: Schema.array(
        Schema.nullable(Schema.struct({ another: Schema.number }))
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
    const schema = Schema.struct({
      field: Schema.array(
        Schema.nullable(
          Schema.struct({ another: Schema.literal("a", "b", "c") })
        )
      )
    })

    expect(
      getErrorOrThrow(schema, { field: [null, { another: null }] })
    ).toEqual("field[1].another must be \"a\", \"b\" or \"c\", received null")
  })

  test("struct with literal", () => {
    const schema = Schema.struct({ patrik: Schema.literal("kure", "dominik") })

    expect(getErrorOrThrow(schema, {})).toEqual("patrik is missing")
    expect(getErrorOrThrow(schema, { patrik: 1 })).toEqual(
      "patrik must be \"kure\" or \"dominik\", received 1"
    )
  })

  test("literal", () => {
    const schema1 = Schema.literal("a", "b")

    expect(getErrorOrThrow(schema1, "c")).toEqual(
      "value must be \"a\" or \"b\", received \"c\""
    )

    const schema2 = Schema.literal("a", "b", "c")

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
      Schema.struct({
        hello: Schema.tuple(Schema.string, Schema.tuple(Schema.string))
      }),
      evaluate({
        hello: ["a", []]
      })
    )

    expect(errors).toEqual("hello[1][0] is missing")
  })
})
