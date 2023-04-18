import * as OpenApi from "schema-openapi";

import * as S from "@effect/schema/Schema";

const fillDefaultSchemas = <I extends InputSchemas>({
  response,
  query,
  params,
  body,
}: I): ComputeEndpoint<string, I>["schemas"] => ({
  response,
  query: (query ?? IgnoredSchemaId) as ComputeEndpoint<
    string,
    I
  >["schemas"]["query"],
  params:
    params ??
    (IgnoredSchemaId as ComputeEndpoint<string, I>["schemas"]["params"]),
  body:
    body ?? (IgnoredSchemaId as ComputeEndpoint<string, I>["schemas"]["body"]),
});

export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");
export type IgnoredSchemaId = typeof IgnoredSchemaId;

export interface Endpoint<
  Id extends string = string,
  Query = any,
  Params = any,
  Body = any,
  Response = any,
> {
  id: Id;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  schemas: {
    query: Query;
    params: Params;
    body: Body;
    response: S.Schema<Response>;
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

export type InputSchemas<
  QueryS = any,
  ParamsS = any,
  BodyS = any,
  Response = any,
> = {
  response: S.Schema<Response>;
  query?: QueryS;
  params?: ParamsS;
  body?: BodyS;
};

export type ComputeEndpoint<
  Id extends string,
  I extends InputSchemas,
> = S.Spread<
  Endpoint<
    Id,
    I["query"] extends Record<string, S.Schema<any>>
      ? I["query"]
      : IgnoredSchemaId,
    I["params"] extends Record<string, S.Schema<any>>
      ? I["params"]
      : IgnoredSchemaId,
    I["body"] extends S.Schema<any> ? I["body"] : IgnoredSchemaId,
    S.To<I["response"]>
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
