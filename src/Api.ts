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

/** @internal */
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

/** @internal */
export const endpoint =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <const Id extends string, const I extends InputSchemas>(
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

    const newEndpoint = {
      schemas: fillDefaultSchemas(schemas),
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
export interface Endpoint<
  Id extends string = string,
  Response = any,
  Query = any,
  Params = any,
  Body = any,
  Headers = any,
> {
  id: Id;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  schemas: {
    response: Response;
    query: Query;
    params: Params;
    body: Body;
    headers: Headers;
  };
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
export type RecordOptionalSchema =
  | Record<string, Schema.Schema<any>>
  | undefined;

/**
 * @category models
 * @since 1.0.0
 */
export type InputSchemas<
  Response = Schema.Schema<any>,
  Query = RecordOptionalSchema,
  Params = RecordOptionalSchema,
  Body = Schema.Schema<any> | undefined,
  Headers = RecordOptionalSchema,
> = {
  response: Response;
  query?: Query;
  params?: Params;
  body?: Body;
  headers?: Headers;
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

/**
 * @ignored
 * @since 1.0.0
 */
export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");

/**
 * @ignored
 * @since 1.0.0
 */
export type IgnoredSchemaId = typeof IgnoredSchemaId;

/**
 * @ignored
 * @since 1.0.0
 */
export type ComputeEndpoint<
  Id extends string,
  I extends InputSchemas,
> = Schema.Spread<
  Endpoint<
    Id,
    I["response"] extends Schema.Schema<any, any> ? I["response"] : never,
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

/**
 * @ignored
 * @since 1.0.0
 */
export type AddEndpoint<
  A extends Api | ApiGroup,
  Id extends string,
  Schemas extends InputSchemas,
> = A extends Api<infer E>
  ? Api<[...E, ComputeEndpoint<Id, Schemas>]>
  : A extends ApiGroup<infer E>
  ? ApiGroup<[...E, ComputeEndpoint<Id, Schemas>]>
  : never;

/**
 * @category models
 * @since 1.0.0
 */
export type EndpointSetter = <
  const Id extends string,
  const I extends InputSchemas,
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
