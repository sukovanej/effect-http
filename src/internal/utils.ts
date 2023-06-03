import * as Schema from "@effect/schema/Schema";

import { IgnoredSchemaId } from "effect-http/internal/api";

/** @internal */
export const getSchema = <A>(
  input: Schema.Schema<A> | IgnoredSchemaId,
): Schema.Schema<A> =>
  input == IgnoredSchemaId ? (Schema.unknown as Schema.Schema<A>) : input;

/** @internal */
export const getStructSchema = (
  input: Record<string, Schema.Schema<any>> | IgnoredSchemaId,
): Schema.Schema<any> =>
  input == IgnoredSchemaId ? Schema.unknown : Schema.struct(input);
