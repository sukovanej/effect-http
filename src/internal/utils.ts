import * as Schema from "@effect/schema/Schema";

import { IgnoredSchemaId } from "effect-http/Api";

/** @internal */
export const getSchema = (
  input: AnySchema | IgnoredSchemaId,
  defaultSchema: AnySchema = Schema.unknown,
): AnySchema => (input == IgnoredSchemaId ? defaultSchema : input);

/** @internal */
export const isArray = (input: unknown): input is readonly any[] =>
  Array.isArray(input);

export type AnySchema = Schema.Schema<any>;
export type SchemaTo<S> = S extends Schema.Schema<any, infer A> ? A : never;
