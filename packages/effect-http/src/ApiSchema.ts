/**
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import * as internal from "./internal/api-schema.js"

/**
 * @category type id
 * @since 1.0.0
 */
export const IgnoredId: unique symbol = internal.IgnoredId

/**
 * @category models
 * @since 1.0.0
 */
export type IgnoredId = typeof IgnoredId

/**
 * @category type id
 * @since 1.0.0
 */
export const Ignored: Ignored = internal.Ignored

/**
 * @category type id
 * @since 1.0.0
 */
export interface Ignored {
  readonly [IgnoredId]: IgnoredId
}

/**
 * @category refinements
 * @since 1.0.0
 */
export const isIgnored = (u: unknown): u is Ignored => (u as Ignored)?.[IgnoredId] === IgnoredId

/**
 * FormData schema
 *
 * @category schemas
 * @since 1.0.0
 */
export const FormData: Schema.Schema<FormData> = internal.formDataSchema
