import type * as OpenApi from "schema-openapi";

import type * as Schema from "@effect/schema/Schema";

import * as internal from "../internal/api";
import type { AuthenticationType } from "./Authentication";

export interface Endpoint<
  Id extends string = string,
  Authentication extends AuthenticationType = AuthenticationType,
  Response = any,
  Query = any,
  Params = any,
  Body = any,
  Headers = any,
> {
  id: Id;
  authentication: Authentication;
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
}

export type AnyApi = Api<Endpoint[]>;

export const ApiId = Symbol("effect-http/api-id");
export type ApiId = typeof ApiId;

export type Api<E extends Endpoint[] = Endpoint[]> = {
  readonly [ApiId]: ApiId;
  endpoints: E;
  options: {
    title: string;
    version: string;
  };
};

export type ApiGroup<E extends Endpoint[] = Endpoint[]> = {
  endpoints: E;
  groupName: string;
};

type RecordOptionalSchema = Record<string, Schema.Schema<any>> | undefined;

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

type NonRequired<T> = { [K in keyof T]?: T[K] };

const DEFAULT_OPTIONS: Api["options"] = {
  title: "Api",
  version: "1.0.0",
};

export const api = (options?: NonRequired<Api["options"]>): Api<[]> => ({
  [ApiId]: ApiId,
  options: {
    ...DEFAULT_OPTIONS,
    ...options,
  },
  endpoints: [],
});

export const get = internal.endpoint("get");
export const post = internal.endpoint("post");
export const put = internal.endpoint("put");
export const head = internal.endpoint("head");
export const patch = internal.endpoint("patch");
export const trace = internal.endpoint("trace");
export const _delete = internal.endpoint("delete");
export { _delete as delete };
export const options = internal.endpoint("options");

/** Create new API group with a given name */
export const apiGroup = (groupName: string): ApiGroup<[]> => ({
  endpoints: [],
  groupName,
});

/** Merge the Api `Group` with an `Api` */
export const addGroup: <E2 extends Endpoint[]>(
  apiGroup: ApiGroup<E2>,
) => <E1 extends Endpoint[]>(api: Api<E1>) => Api<[...E1, ...E2]> =
  internal.addGroup;
