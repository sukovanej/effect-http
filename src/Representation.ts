import type * as Schema from "@effect/schema/Schema";
import * as internal from "effect-http/internal/representation";
import type * as Pipeable from "effect/Pipeable";

/**
 * @category type id
 * @since 1.0.0
 */
export const TypeId: unique symbol = internal.TypeId;

/**
 * @category type id
 * @since 1.0.0
 */
export type TypeId = typeof TypeId;

/**
 * @category models
 * @since 1.0.0
 */
export interface Representation<A> extends Pipeable.Pipeable {
  readonly [TypeId]: TypeId;
  readonly schema: Schema.Schema<string, A>;
  contentType: string;
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <A>(
  fields: Omit<Representation<A>, TypeId>,
) => Representation<A> = internal.make;

/**
 * @category representations
 * @since 1.0.0
 */
export const json: Representation<unknown> = internal.json;

/**
 * @category representations
 * @since 1.0.0
 */
export const plainText: Representation<string> = internal.plainText;
