import { Effect, Option, ParseResult, pipe, Schema } from "effect"
import { ExampleServer } from "effect-http"

import { describe, expect, test } from "vitest"

test("struct", () => {
  const es = Effect.runSync(
    ExampleServer.makeSchema(Schema.Struct({ name: Schema.Number }))
  )

  expect(typeof es).toBe("object")
  expect(Object.getOwnPropertyNames(es).length).toBe(1)
  expect(typeof es.name).toBe("number")
})

test("with test annotation", () => {
  const example1 = Effect.runSync(
    ExampleServer.makeSchema(
      Schema.Struct({ name: pipe(Schema.Number, Schema.annotations({ examples: [1] })) })
    )
  )

  expect(example1).toEqual({ name: 1 })

  const IntegerFromString = pipe(
    Schema.NumberFromString,
    Schema.int(),
    Schema.annotations({ examples: [42, 69] }),
    Schema.brand("Integer")
  )

  const example2 = Effect.runSync(ExampleServer.makeSchema(IntegerFromString))
  expect(example2).oneOf([42, 69])

  class MyClass {}

  const MyClassSchema = Schema.instanceOf(MyClass, {
    examples: [new MyClass()]
  })
  const example3 = Effect.runSync(ExampleServer.makeSchema(MyClassSchema))
  expect(example3).toBeInstanceOf(MyClass)

  const TransformedSchema = Schema.transformOrFail(Schema.String, MyClassSchema, {
    decode: () => ParseResult.succeed(new MyClass()),
    encode: () => ParseResult.succeed("hello")
  })

  const example4 = Effect.runSync(ExampleServer.makeSchema(TransformedSchema))
  expect(example4).toBeInstanceOf(MyClass)
})

test("big struct", () => {
  const example = Effect.runSync(
    ExampleServer.makeSchema(
      Schema.Struct({
        name: Schema.Number,
        value: Schema.String,
        another: Schema.Boolean,
        hello: Schema.Struct({
          patrik: Schema.Literal("borec"),
          another: Schema.Array(Schema.Union(Schema.String, Schema.Number))
        }),
        another3: Schema.Boolean,
        another4: Schema.Boolean,
        another5: Schema.Boolean
      })
    )
  )
  expect(typeof example).toBe("object")
  expect(Object.getOwnPropertyNames(example).length).toBe(7)
  expect(example.another3).oneOf([true, false])
})

test("list", () => {
  const example = Effect.runSync(ExampleServer.makeSchema(Schema.Array(Schema.String)))

  expect(Array.isArray(example)).toBe(true)

  for (const value of example) {
    expect(typeof value).toBe("string")
  }
})

test("tuple", () => {
  const example = Effect.runSync(
    ExampleServer.makeSchema(
      Schema.Tuple(
        Schema.Literal("a"),
        Schema.Union(Schema.Literal("b"), Schema.Literal("c"))
      )
    )
  )

  expect(example[0]).toEqual("a")
  expect(example[1]).oneOf(["b", "c"])
})

describe("date", () => {
  test("simple", () => {
    const date = Effect.runSync(
      ExampleServer.makeSchema(Schema.Date)
    )
    expect(date).toBeInstanceOf(Date)
  })

  test("in struct", () => {
    const dateStruct = Effect.runSync(
      ExampleServer.makeSchema(Schema.Struct({ date: Schema.Date }))
    )
    expect(dateStruct.date).toBeInstanceOf(Date)
  })
})

describe("template literal", () => {
  test("simple", () => {
    const es = Effect.runSync(
      ExampleServer.makeSchema(Schema.TemplateLiteral("zdar"))
    )

    expect(es).toBe("zdar")
  })

  test("number literal", () => {
    const es = Effect.runSync(
      ExampleServer.makeSchema(
        Schema.TemplateLiteral(Schema.Literal("1"), "2")
      )
    )

    expect(es).toBe("12")
  })

  test("number schema", () => {
    const example = Effect.runSync(
      ExampleServer.makeSchema(
        Schema.TemplateLiteral(
          Schema.Number,
          Schema.Literal("test"),
          Schema.Number
        )
      )
    )

    const reg = /(\d+)(\.\d+)?(test)(\d+)(\.\d+)?/
    expect(reg.test(example)).toBe(true)
  })

  test("string schema", () => {
    const example = Effect.runSync(
      ExampleServer.makeSchema(Schema.TemplateLiteral(Schema.Number, Schema.String))
    )

    const reg = /(\d+)(\.\d+)?/
    expect(reg.test(example)).toBe(true)
  })

  test("union", () => {
    const es = Effect.runSync(
      ExampleServer.makeSchema(
        Schema.TemplateLiteral(
          "1",
          Schema.Union(Schema.Literal("2"), Schema.Literal("3"))
        )
      )
    )

    expect(es).oneOf(["12", "13"])
  })
})

test("Declaration", () => {
  const schema = Schema.OptionFromNullOr(Schema.String)
  const example = Effect.runSync(ExampleServer.makeSchema(schema))

  expect(Option.isOption(example)).toBe(true)
})

test("Integers", () => {
  const schema = Schema.Tuple(
    Schema.Number,
    Schema.BigInt,
    Schema.Number.pipe(Schema.int(), Schema.brand("Integer"))
  )
  const example = Effect.runSync(ExampleServer.makeSchema(schema))

  expect(example).toEqual([1, BigInt(2), 3])
})

describe("constraints", () => {
  test("int", () => {
    const schema = Schema.Number.pipe(Schema.int())
    const example = Effect.runSync(ExampleServer.makeSchema(schema))

    expect(example).toEqual(1)
  })

  test("int between", () => {
    const schema = Schema.Number.pipe(Schema.int(), Schema.between(5, 10))
    const example = Effect.runSync(ExampleServer.makeSchema(schema))

    expect(example).toEqual(5)
  })
  test("bigint constraints", () => {
    const schema = Schema.Tuple(
      Schema.BigIntFromSelf.pipe(Schema.greaterThanBigInt(BigInt(-1))),
      Schema.BigIntFromSelf.pipe(Schema.greaterThanOrEqualToBigInt(BigInt(12))),
      Schema.BigIntFromSelf.pipe(Schema.lessThanBigInt(BigInt(-1))),
      Schema.BigIntFromSelf.pipe(Schema.lessThanOrEqualToBigInt(BigInt(12)))
    )
    const example = Effect.runSync(ExampleServer.makeSchema(schema))

    expect(example).toEqual([BigInt(1), BigInt(12), BigInt(-2), BigInt(4)])
  })

  test("multiple constraints", () => {
    const schema = Schema.Tuple(
      Schema.Number.pipe(Schema.int(), Schema.between(5, 10)),
      Schema.Number.pipe(Schema.greaterThan(-1)),
      Schema.Number.pipe(Schema.greaterThanOrEqualTo(12)),
      Schema.Number.pipe(Schema.lessThan(3)),
      Schema.Number.pipe(Schema.lessThanOrEqualTo(7))
    )
    const example = Effect.runSync(ExampleServer.makeSchema(schema))

    expect(example).toEqual([5, 2, 12, 2, 5])
  })

  test("array min length", () => {
    const schema = Schema.Array(Schema.Number).pipe(Schema.minItems(3))

    const example = Effect.runSync(ExampleServer.makeSchema(schema))

    expect(example.length).toBeGreaterThanOrEqual(3)
  })

  // todo
  // test("max length string", () => {
  //  const example = Effect.runSync(ExampleServer.makeSchema(Schema.String.pipe(Schema.maxLength(3))))

  //  expect(example.length).toBeLessThanOrEqual(3)
  // })
})
