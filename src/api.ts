import * as OpenApi from "schema-openapi";

import { Api, ComputeEndpoint, Endpoint, InputSchemas } from "./api-types";
import { fillDefaultSchemas } from "./internal";

export const make = (): Api<[]> => [];

export const endpoint =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <const Id extends string, const I extends InputSchemas>(
    id: Id,
    path: string,
    schemas: I,
  ) =>
  <A extends Endpoint[]>(self: Api<A>): Api<[...A, ComputeEndpoint<Id, I>]> =>
    [
      ...self,
      {
        schemas: fillDefaultSchemas(schemas),
        id,
        path,
        method,
      } as ComputeEndpoint<Id, I>,
    ];

export const get = endpoint("get");
export const post = endpoint("post");
export const put = endpoint("put");
export const head = endpoint("head");
export const patch = endpoint("patch");
export const trace = endpoint("trace");
export const _delete = endpoint("delete");
export { _delete as delete };
export const options = endpoint("options");
