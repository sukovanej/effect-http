/**
 * Derivation of utilities.
 *
 * @since 1.0.0
 */
import { Schema } from "@effect/schema";
import { type Types } from "effect";
import type * as Api from "effect-http/Api";
import { RequiredFields } from "effect-http/ServerBuilder";
import { AnySchema, SchemaTo, isArray } from "effect-http/internal/utils";

/**
 * Derive utility object with methods enabling type-safe response object creation.
 *
 * @since 1.0.0
 */
export const responseUtil = <E extends Api.Endpoint>(
  endpoint: E,
): ResponseUtil<E> => {
  const responseSchema = endpoint.schemas.response;

  if (Schema.isSchema(responseSchema)) {
    return {} as any;
  }

  return (isArray(responseSchema) ? responseSchema : [responseSchema]).reduce(
    (obj, responseSchema) => ({
      ...obj,
      [`response${responseSchema.status}`]: (data: any) => ({
        status: responseSchema.status,
        ...data,
      }),
    }),
    {},
  ) as any;
};

// Internal type helpers

/** @ignore */
export type ResponseUtil<E extends Api.Endpoint> = Types.Simplify<
  NormalizedSchemasByIdToResponseUtils<SchemasByIdFromApi<E>>
>;

/** @ignore */
type SchemasByIdFromApi<E extends Api.Endpoint> = E extends any
  ? NormalizeSchemas<E["schemas"]["response"]>
  : never;

/** @ignore */
type NormalizedSchemasBydId = {
  status: number;
  input: { content?: unknown; headers?: unknown };
};

/** @ignore */
type NormalizedSchemasByIdToResponseUtils<M extends NormalizedSchemasBydId> = {
  [Status in M["status"] as `response${Status}`]: (
    data: Extract<M, { status: Status }>["input"],
  ) => Types.Simplify<
    { status: Status } & Extract<M, { status: Status }>["input"]
  >;
};

/** @ignore */
type NormalizeSchemas<S extends Api.EndpointSchemas["response"]> =
  S extends readonly Api.ResponseSchemaFull[]
    ? NormalizeResponseSchemaFull<S[number]>
    : S extends Api.ResponseSchemaFull
    ? NormalizeResponseSchemaFull<S>
    : never;

/** @ignore */
type NormalizeResponseSchemaFull<S extends Api.ResponseSchemaFull> =
  S extends any ? { status: S["status"]; input: CreateInput<S> } : never;

/** @ignore */
type CreateInput<
  S extends {
    headers: Api.IgnoredSchemaId | AnySchema;
    content: Api.IgnoredSchemaId | AnySchema;
  },
> = Types.Simplify<{
  [K in Extract<RequiredFields<S>, "headers" | "content">]: SchemaTo<S[K]>;
}>;
