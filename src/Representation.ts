/**
 * `Representation` is a data structure holding information about how to
 * serialize and deserialize a server response for a given conten type.
 *
 * @since 1.0.0
 */
import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import * as Pipeable from "effect/Pipeable";

import * as internal from "./internal/representation.js";

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
export interface Representation extends Pipeable.Pipeable {
  readonly [TypeId]: TypeId;
  readonly stringify: (
    input: unknown,
  ) => Effect.Effect<never, RepresentationError, string>;
  readonly parse: (
    input: string,
  ) => Effect.Effect<never, RepresentationError, unknown>;
  contentType: string;
}

/**
 * @category errors
 * @since 1.0.0
 */
export interface RepresentationError extends Cause.YieldableError {
  readonly _tag: "RepresentationError";
  readonly message: string;
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (fields: Omit<Representation, TypeId>) => Representation =
  internal.make;

/**
 * @category representations
 * @since 1.0.0
 */
export const json: Representation = internal.json;

/**
 * @category representations
 * @since 1.0.0
 */
export const plainText: Representation = internal.plainText;
