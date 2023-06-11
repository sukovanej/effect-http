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

import type * as Schema from "@effect/schema/Schema";

import * as internal from "effect-http/internal/api";

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
 * @category methods
 * @since 1.0.0
 */
export const get = internal.endpoint("get");

/**
 * @category methods
 * @since 1.0.0
 */
export const post = internal.endpoint("post");

/**
 * @category methods
 * @since 1.0.0
 */
export const put = internal.endpoint("put");

/**
 * @category methods
 * @since 1.0.0
 */
export const head = internal.endpoint("head");

/**
 * @category methods
 * @since 1.0.0
 */
export const patch = internal.endpoint("patch");

/**
 * @category methods
 * @since 1.0.0
 */
export const trace = internal.endpoint("trace");

const _delete = internal.endpoint("delete");

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
export const options = internal.endpoint("options");

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
export const addGroup: <E2 extends Endpoint[]>(
  apiGroup: ApiGroup<E2>,
) => <E1 extends Endpoint[]>(api: Api<E1>) => Api<[...E1, ...E2]> =
  internal.addGroup;
