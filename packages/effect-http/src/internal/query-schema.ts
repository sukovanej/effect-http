import * as Schema from "@effect/schema/Schema"
import * as circular from "./circular.js"

/** @internal */
export const Number = Schema.NumberFromString.pipe(
  circular.annotate(() => ({ type: "number", description: "a number" }))
)

export const number = <A, R>(schema: Schema.Schema<A, number, R>) =>
  Schema.compose(Schema.NumberFromString, schema, { strict: true }).pipe(
    circular.annotate(() => ({ type: "number", description: "a number" }))
  )

/** @internal */
export const Array = <A, R>(
  schema: Schema.Schema<A, string, R>
): Schema.optionalWithOptions<
  Schema.Schema<ReadonlyArray<A>, string | ReadonlyArray<string>, R>,
  { exact: true; default: () => [] }
> => {
  const stringToStringArraySchema = Schema.transform(Schema.String, Schema.Array(Schema.String), {
    decode: (i) => [i],
    encode: (i) => i[0]
  })
  const arraySchema = Schema.Array(schema)
  const stringToArraySchema = Schema.compose(stringToStringArraySchema, arraySchema, { strict: true })

  Schema.withDefaults

  return Schema.optional(
    Schema.Union(stringToArraySchema, arraySchema).pipe(
      circular.annotate((compile) => ({ type: "array", items: compile(schema) }))
    ),
    { exact: true, default: () => [] }
  )
}

/** @internal */
export const NonEmptyArray = <A, R>(
  schema: Schema.Schema<A, string, R>
): Schema.Schema<readonly [A, ...Array<A>], string | readonly [string, ...Array<string>], R> => {
  const stringToStringArraySchema = Schema.transform(Schema.String, Schema.NonEmptyArray(Schema.String), {
    decode: (i) => [i] as const,
    encode: (i) => i[0]
  })
  const arraySchema = Schema.NonEmptyArray(schema)
  const stringToArraySchema = Schema.compose(stringToStringArraySchema, arraySchema, { strict: true })

  return Schema.Union(stringToArraySchema, arraySchema).pipe(
    circular.annotate((compile) => ({ type: "array", items: compile(schema) }))
  )
}
