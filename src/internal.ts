import * as S from "@effect/schema/Schema";

import { Endpoint } from "./api";

type NonIgnoredFields<K extends keyof A, A> = K extends any
  ? A[K] extends S.Schema<any>
    ? K
    : never
  : never;

export type RemoveIgnoredSchemas<E> = Pick<E, NonIgnoredFields<keyof E, E>>;

type SchemaStructTo<A> = {
  [K in keyof A]: A[K] extends S.Schema<infer X> ? X : never;
};

export type EndpointSchemasToInput<E extends Endpoint["schemas"]> = S.Spread<
  SchemaStructTo<RemoveIgnoredSchemas<Omit<E, "response">>>
>;

export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;
