/**
 * HTTP query parameters.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"

import * as internal from "./internal/query-schema.js"

/**
 * @category schema
 * @since 1.0.0
 */
export const Number: Schema.Schema<number, string> = internal.Number

/**
 * @category schema
 * @since 1.0.0
 */
export const Array: <A, R>(
  schema: Schema.Schema<A, string, R>
) => Schema.optionalWithOptions<
  Schema.Schema<ReadonlyArray<A>, string | ReadonlyArray<string>, R>,
  { exact: true; default: () => [] }
> = internal.Array

/**
 * @category schema
 * @since 1.0.0
 */
export const NonEmptyArray: <A, R>(
  schema: Schema.Schema<A, string, R>
) => Schema.Schema<readonly [A, ...Array<A>], string | readonly [string, ...Array<string>], R> = internal.NonEmptyArray
