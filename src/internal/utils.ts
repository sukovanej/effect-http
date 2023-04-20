import * as Schema from "@effect/schema/Schema";

import type { Endpoint } from "../Api";
import { IgnoredSchemaId } from "./api";

type NonIgnoredFields<K extends keyof A, A> = K extends any
  ? A[K] extends
      | Schema.Schema<any, any>
      | Record<string, Schema.Schema<any, any>>
    ? K
    : never
  : never;

export type RemoveIgnoredSchemas<E> = Pick<E, NonIgnoredFields<keyof E, E>>;

type SchemaStructTo<A> = {
  [K in keyof A]: K extends "query" | "params" | "headers"
    ? A[K] extends Record<string, Schema.Schema<any>>
      ? { [KQ in keyof A[K]]: Schema.To<A[K][KQ]> }
      : never
    : A[K] extends Schema.Schema<any, infer X>
    ? X
    : never;
};

export type EndpointSchemasToInput<E extends Endpoint["schemas"]> =
  Schema.Spread<SchemaStructTo<RemoveIgnoredSchemas<Omit<E, "response">>>>;

export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;

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
