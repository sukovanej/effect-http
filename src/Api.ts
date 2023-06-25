/**
 * `Api` represents the API specification. It doesn't hold information concerning the
 * server or client side details. An instance of `Api` can be used to derive a client
 * implementation (see `Client.ts`).
 *
 * The generated type of the `Api` is used during server implementation. The type safety
 * guarantees the server-side implementation and the `Api` specification are compatible.
 *
 * @since 1.0.0
 */
import type * as OpenApi from "schema-openapi";

import * as HashSet from "@effect/data/HashSet";
import type * as Schema from "@effect/schema/Schema";

import { isArray } from "./internal/utils";

/** Headers are case-insensitive, internally we deal with them as lowercase
 *  because that's how express deal with them.
 *
 *  @internal
 */
export const fieldsToLowerCase = (s: SchemasMap<any>) =>
  Object.entries(s).reduce(
    (acc, [key, value]) => ({ ...acc, [key.toLowerCase()]: value }),
    {},
  );

/** @internal */
const composeResponseSchema = (response: readonly InputResponseSchemaFull[]) =>
  response.map(
    (r) =>
      ({
        status: r.status,
        headers: (r.headers && fieldsToLowerCase(r.headers)) ?? IgnoredSchemaId,
        content: r.content ?? IgnoredSchemaId,
      }) as const,
  );

/** @internal */
const createSchemasFromInput = <I extends InputEndpointSchemas>({
  response,
  query,
  params,
  body,
  headers,
}: I): CreateEndpointSchemasFromInput<I> =>
  ({
    response: Array.isArray(response)
      ? composeResponseSchema(response)
      : response,
    query: query ?? IgnoredSchemaId,
    params: params ?? IgnoredSchemaId,
    body: body ?? IgnoredSchemaId,
    headers: (headers && fieldsToLowerCase(headers)) ?? IgnoredSchemaId,
  }) as CreateEndpointSchemasFromInput<I>;

/** @internal */
export const endpoint =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <const Id extends string, const I extends InputEndpointSchemas>(
    id: Id,
    path: string,
    schemas: I,
    options?: EndpointOptions,
  ) =>
  <A extends Api | ApiGroup>(api: A): AddEndpoint<A, Id, I> => {
    if (method === "get" && schemas.body !== undefined) {
      throw new Error(`Invalid ${id} endpoint. GET request cant have a body.`);
    }

    if (api.endpoints.find((endpoint) => endpoint.id === id) !== undefined) {
      throw new Error(`Endpoint with operation id ${id} already exists`);
    }

    if (
      isArray(schemas.response) &&
      HashSet.size(
        HashSet.make(...schemas.response.map(({ status }) => status)),
      ) !== schemas.response.length
    ) {
      throw new Error(
        `Responses for endpoint ${id} must have unique status codes`,
      );
    }

    const newEndpoint = {
      schemas: createSchemasFromInput(schemas),
      id,
      path,
      method,
      groupName: "groupName" in api ? api.groupName : "default",
      ...options,
    };

    return {
      ...api,
      endpoints: [...api.endpoints, newEndpoint],
    } as unknown as AddEndpoint<A, Id, I>;
  };

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointSchemas {
  response: Schema.Schema<any> | readonly ResponseSchemaFull[];
  query: SchemasMap<string> | IgnoredSchemaId;
  params: SchemasMap<string> | IgnoredSchemaId;
  body: Schema.Schema<any> | IgnoredSchemaId;
  headers: SchemasMap<string> | IgnoredSchemaId;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Endpoint {
  id: string;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  schemas: EndpointSchemas;
  groupName: string;
  description?: string;
}

/**
 * @category models
 * @since 1.0.0
 */
export type Api<E extends Endpoint[] = Endpoint[]> = {
  endpoints: E;
  options: {
    title: string;
    version: string;
  };
};

/**
 * @category models
 * @since 1.0.0
 */
export type ApiGroup<E extends Endpoint[] = Endpoint[]> = {
  endpoints: E;
  groupName: string;
};

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointOptions {
  description?: string;
}

/**
 * @category models
 * @since 1.0.0
 */
export type InputEndpointSchemas = {
  response: readonly InputResponseSchemaFull[] | Schema.Schema<any>;
  query?: SchemasMap<string>;
  params?: SchemasMap<string>;
  body?: Schema.Schema<any>;
  headers?: SchemasMap<string>;
};

/** @internal */
const DEFAULT_OPTIONS: Api["options"] = {
  title: "Api",
  version: "1.0.0",
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const api = (options?: Partial<Api["options"]>): Api<[]> => ({
  options: {
    ...DEFAULT_OPTIONS,
    ...options,
  },
  endpoints: [],
});

type CreateEndpointFromInput<
  Id extends string,
  Schemas extends InputEndpointSchemas,
> = {
  id: Id;
  schemas: CreateEndpointSchemasFromInput<Schemas>;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  groupName: string;
  description?: string;
};

/**
 * @category models
 * @since 1.0.0
 */
type EndpointSetter = <
  const Id extends string,
  const I extends InputEndpointSchemas,
>(
  id: Id,
  path: string,
  schemas: I,
  options?: EndpointOptions,
) => <A extends Api | ApiGroup>(api: A) => AddEndpoint<A, Id, I>;

/**
 * @category methods
 * @since 1.0.0
 */
export const get: EndpointSetter = endpoint("get");

/**
 * @category methods
 * @since 1.0.0
 */
export const post: EndpointSetter = endpoint("post");

/**
 * @category methods
 * @since 1.0.0
 */
export const put: EndpointSetter = endpoint("put");

/**
 * @category methods
 * @since 1.0.0
 */
export const head: EndpointSetter = endpoint("head");

/**
 * @category methods
 * @since 1.0.0
 */
export const patch: EndpointSetter = endpoint("patch");

/**
 * @category methods
 * @since 1.0.0
 */
export const trace: EndpointSetter = endpoint("trace");

const _delete: EndpointSetter = endpoint("delete");

export {
  /**
   * @category methods
   * @since 1.0.0
   */
  _delete as delete,
};

/**
 * @category methods
 * @since 1.0.0
 */
export const options = endpoint("options");

/**
 * Create new API group with a given name
 *
 * @category constructors
 * @since 1.0.0
 */
export const apiGroup = (groupName: string): ApiGroup<[]> => ({
  endpoints: [],
  groupName,
});

/**
 * Merge the Api `Group` with an `Api`
 *
 * @category combinators
 * @since 1.0.0
 */
export const addGroup =
  <E2 extends Endpoint[]>(apiGroup: ApiGroup<E2>) =>
  <E1 extends Endpoint[]>(api: Api<E1>): Api<[...E1, ...E2]> => {
    const existingIds = HashSet.make(...api.endpoints.map(({ id }) => id));
    const newIds = HashSet.make(...apiGroup.endpoints.map(({ id }) => id));
    const duplicates = HashSet.intersection(existingIds, newIds);

    if (HashSet.size(duplicates) > 0) {
      throw new Error(
        `Api group introduces already existing operation ids: ${duplicates}`,
      );
    }

    return {
      ...api,
      endpoints: [...api.endpoints, ...apiGroup.endpoints],
    };
  };

// Internal type helpers

/** @ignore */
type AddEndpoint<
  A extends Api | ApiGroup,
  Id extends string,
  Schemas extends InputEndpointSchemas,
> = A extends Api<infer E>
  ? Api<[...E, CreateEndpointFromInput<Id, Schemas>]>
  : A extends ApiGroup<infer E>
  ? ApiGroup<[...E, CreateEndpointFromInput<Id, Schemas>]>
  : never;

/** @ignore */
export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");

/** @ignore */
export type IgnoredSchemaId = typeof IgnoredSchemaId;

/** @ignore */
type ResponseSchemaFromInput<S extends InputEndpointSchemas["response"]> =
  S extends Schema.Schema<any>
    ? S
    : S extends readonly InputResponseSchemaFull[]
    ? ComputeEndpointResponseFull<S>
    : never;

/** @ignore */
export type CreateEndpointSchemasFromInput<I extends InputEndpointSchemas> =
  Schema.Spread<{
    response: ResponseSchemaFromInput<I["response"]>;
    query: UndefinedToIgnoredSchema<I["query"]>;
    params: UndefinedToIgnoredSchema<I["params"]>;
    body: UndefinedToIgnoredSchema<I["body"]>;
    headers: I["headers"] extends SchemasMap<any>
      ? {
          [K in keyof I["headers"] as K extends string
            ? Lowercase<K>
            : never]: I["headers"][K];
        }
      : IgnoredSchemaId;
  }>;

/** @ignore */
type UndefinedToIgnoredSchema<S extends unknown | undefined> = S extends
  | Schema.Schema<any>
  | SchemasMap<any>
  ? S
  : IgnoredSchemaId;

/** @ignore */
export type ComputeEndpointResponseFull<
  Rs extends readonly InputResponseSchemaFull[],
> = Rs extends readonly [infer R, ...infer Rest]
  ? R extends InputResponseSchemaFull
    ? Rest extends readonly InputResponseSchemaFull[]
      ? [
          {
            status: R["status"];
            content: UndefinedToIgnoredSchema<R["content"]>;
            headers: R["headers"] extends SchemasMap
              ? {
                  [K in keyof R["headers"] as K extends string
                    ? Lowercase<K>
                    : never]: R["headers"][K];
                }
              : IgnoredSchemaId;
          },
          ...ComputeEndpointResponseFull<Rest>,
        ]
      : never
    : never
  : [];

/** @ignore */
export type SchemasMap<From = any> = Record<string, Schema.Schema<From, any>>;

/** @ignore */
export type SchemasMapTo<S extends SchemasMap<any>> = {
  [K in keyof S]: Schema.To<S[K]>;
};

/** @ignore */
export type ResponseSchemaFull = {
  status: number;
  content: Schema.Schema<any> | IgnoredSchemaId;
  headers: SchemasMap<string> | IgnoredSchemaId;
};

/** @ignore */
export type InputResponseSchemaFull = {
  status: number;
  content?: Schema.Schema<any>;
  headers?: SchemasMap<string>;
};
