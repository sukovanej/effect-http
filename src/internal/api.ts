import type * as OpenApi from "schema-openapi";

import type * as Schema from "@effect/schema/Schema";

import type { Api, ApiGroup, Endpoint, InputSchemas } from "../Api";

export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");
export type IgnoredSchemaId = typeof IgnoredSchemaId;

export type ComputeEndpoint<
  Id extends string,
  I extends InputSchemas,
> = Schema.Spread<
  Endpoint<
    Id,
    Schema.To<I["response"]>,
    I["query"] extends Record<string, Schema.Schema<any>>
      ? I["query"]
      : IgnoredSchemaId,
    I["params"] extends Record<string, Schema.Schema<any>>
      ? I["params"]
      : IgnoredSchemaId,
    I["body"] extends Schema.Schema<any> ? I["body"] : IgnoredSchemaId,
    I["headers"] extends Record<string, Schema.Schema<any>>
      ? {
          [K in keyof I["headers"] as K extends string
            ? Lowercase<K>
            : never]: I["headers"][K];
        }
      : IgnoredSchemaId
  >
>;

/** Headers are case-insensitive, internally we deal with them as lowercase
 *  because that's how express deal with them.
 *
 *  @internal
 */
export const normalizeSchemaStruct = (s: Record<string, Schema.Schema<any>>) =>
  Object.entries(s).reduce(
    (acc, [key, value]) => ({ ...acc, [key.toLowerCase()]: value }),
    {},
  );

const fillDefaultSchemas = <I extends InputSchemas>({
  response,
  query,
  params,
  body,
  headers,
}: I): ComputeEndpoint<string, I>["schemas"] =>
  ({
    response,
    query: query ?? IgnoredSchemaId,
    params: params ?? IgnoredSchemaId,
    body: body ?? IgnoredSchemaId,
    headers: (headers && normalizeSchemaStruct(headers)) ?? IgnoredSchemaId,
  } as ComputeEndpoint<string, I>["schemas"]);

export type AddEndpoint<
  A extends Api | ApiGroup,
  Id extends string,
  Schemas extends InputSchemas,
> = A extends Api<infer E>
  ? Api<[...E, ComputeEndpoint<Id, Schemas>]>
  : A extends ApiGroup<infer E>
  ? ApiGroup<[...E, ComputeEndpoint<Id, Schemas>]>
  : never;

/** @internal */
export const endpoint =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <const Id extends string, const I extends InputSchemas>(
    id: Id,
    path: string,
    schemas: I,
  ) =>
  <A extends Api | ApiGroup>(api: A): AddEndpoint<A, Id, I> =>
    ({
      ...api,
      endpoints: [
        ...api.endpoints,
        {
          schemas: fillDefaultSchemas(schemas),
          id,
          path,
          method,
          groupName: "groupName" in api ? api.groupName : "default",
        },
      ],
    } as unknown as AddEndpoint<A, Id, I>);
