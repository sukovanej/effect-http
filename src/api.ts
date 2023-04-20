import * as OpenApi from "schema-openapi";

import * as S from "@effect/schema/Schema";

import { normalizeSchemaStruct } from "./internal";

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

export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");
export type IgnoredSchemaId = typeof IgnoredSchemaId;

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
    response: S.Schema<Response>;
    query: Query;
    params: Params;
    body: Body;
    headers: Headers;
  };
  groupName: string;
}

export type AnyApi = Api<Endpoint[]>;

export type Api<E extends Endpoint[] = Endpoint[]> = {
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

type RecordOptionalSchema = Record<string, S.Schema<any>> | undefined;

export type InputSchemas<
  Response = any,
  Query = any,
  Params = any,
  Body = any,
  Headers = RecordOptionalSchema,
> = {
  response: S.Schema<Response>;
  query?: Query;
  params?: Params;
  body?: Body;
  headers?: Headers;
};

export type ComputeEndpoint<
  Id extends string,
  I extends InputSchemas,
> = S.Spread<
  Endpoint<
    Id,
    S.To<I["response"]>,
    I["query"] extends Record<string, S.Schema<any>>
      ? I["query"]
      : IgnoredSchemaId,
    I["params"] extends Record<string, S.Schema<any>>
      ? I["params"]
      : IgnoredSchemaId,
    I["body"] extends S.Schema<any> ? I["body"] : IgnoredSchemaId,
    I["headers"] extends Record<string, S.Schema<any>>
      ? {
          [K in keyof I["headers"] as K extends string
            ? Lowercase<K>
            : never]: I["headers"][K];
        }
      : IgnoredSchemaId
  >
>;

type NonRequired<T> = { [K in keyof T]?: T[K] };

const DEFAULT_OPTIONS: Api["options"] = {
  title: "Api",
  version: "1.0.0",
};

export const api = (options?: NonRequired<Api["options"]>): Api<[]> => ({
  options: {
    ...DEFAULT_OPTIONS,
    ...options,
  },
  endpoints: [],
});

type AddEndpoint<
  A extends Api | ApiGroup,
  Id extends string,
  Schemas extends InputSchemas,
> = A extends Api<infer E>
  ? Api<[...E, ComputeEndpoint<Id, Schemas>]>
  : A extends ApiGroup<infer E>
  ? ApiGroup<[...E, ComputeEndpoint<Id, Schemas>]>
  : never;

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

export const get = endpoint("get");
export const post = endpoint("post");
export const put = endpoint("put");
export const head = endpoint("head");
export const patch = endpoint("patch");
export const trace = endpoint("trace");
export const _delete = endpoint("delete");
export { _delete as delete };
export const options = endpoint("options");

/** Create new API group a given name */
export const apiGroup = (groupName: string): ApiGroup<[]> => ({
  endpoints: [],
  groupName,
});

/** Merge the Api `Group` with an `Api` */
export const addGroup =
  <E2 extends Endpoint[]>(apiGroup: ApiGroup<E2>) =>
  <E1 extends Endpoint[]>(api: Api<E1>): Api<[...E1, ...E2]> => ({
    ...api,
    endpoints: [...api.endpoints, ...apiGroup.endpoints],
  });
