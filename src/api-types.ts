import * as OpenApi from "schema-openapi";

import * as S from "@effect/schema/Schema";

export interface Endpoint<
  Id extends string = any,
  Query = any,
  Params = any,
  Body = any,
  Response = any,
> {
  id: Id;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  schemas: {
    query: S.Schema<Query>;
    params: S.Schema<Params>;
    body: S.Schema<Body>;
    response: S.Schema<Response>;
  };
}

export type Api<E extends Endpoint[]> = E;

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
> = I extends InputSchemas<
  S.Schema<infer Q>,
  S.Schema<infer P>,
  S.Schema<infer B>,
  infer R
>
  ? Endpoint<Id, Q, P, B, R>
  : never;
