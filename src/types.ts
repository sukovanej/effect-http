import express from "express";
import * as OpenApi from "schema-openapi";

import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import { ApiError } from "./errors";

export type InputHandler<Query, Params, Body, Response, R> = (
  input: Input<Query, Params, Body>,
) => Effect.Effect<R, ApiError, Response>;

export type FinalHandler<R> = (
  req: express.Request,
  res: express.Response,
) => Effect.Effect<R, ApiError, void>;

export interface Api<R> {
  openApiSpec: OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>;
  handlers: readonly Handler<unknown, unknown, unknown, unknown, R>[];
}

export interface Input<Query, Params, Body> {
  query: Query;
  params: Params;
  body: Body;
}

export type BodyInput<Body> = Input<unknown, unknown, Body>;
export type QueryInput<Query> = Input<Query, unknown, unknown>;

export interface HandlerSchemas<Query, Params, Body, Response> {
  response: S.Schema<Response>;
  query: S.Schema<Query>;
  params: S.Schema<Params>;
  body: S.Schema<Body>;
}

type InputHandlerSchemas<QueryS, ParamsS, BodyS, Response> = {
  response: S.Schema<Response>;
  query?: QueryS;
  params?: ParamsS;
  body?: BodyS;
};

export type AnyInputHandlerSchemas = InputHandlerSchemas<
  S.Schema<any>,
  S.Schema<any>,
  S.Schema<any>,
  any
>;

export type ComputeInputHandler<
  I extends AnyInputHandlerSchemas,
  R,
> = InputHandler<
  ComputeQuery<I>,
  ComputeParams<I>,
  ComputeBody<I>,
  ComputeResponse<I>,
  R
>;

export type ComputeHandler<I extends AnyInputHandlerSchemas, R> = Handler<
  ComputeQuery<I>,
  ComputeParams<I>,
  ComputeBody<I>,
  ComputeResponse<I>,
  R
>;

export type ComputeHandlerSchemas<I extends AnyInputHandlerSchemas> =
  HandlerSchemas<
    ComputeQuery<I>,
    ComputeParams<I>,
    ComputeBody<I>,
    ComputeResponse<I>
  >;

type ComputeQuery<T> = T extends InputHandlerSchemas<infer Q, any, any, any>
  ? Q extends S.Schema<infer S>
    ? S
    : unknown
  : never;

type ComputeParams<T> = T extends InputHandlerSchemas<any, infer P, any, any>
  ? P extends S.Schema<infer S>
    ? S
    : unknown
  : never;

type ComputeBody<T> = T extends InputHandlerSchemas<any, any, infer B, any>
  ? B extends S.Schema<infer S>
    ? S
    : unknown
  : never;

type ComputeResponse<T> = T extends InputHandlerSchemas<any, any, any, infer R>
  ? R
  : never;

export interface Handler<Query, Params, Body, Response, R> {
  handler: FinalHandler<R>;
  schemas: HandlerSchemas<Query, Params, Body, Response>;
  method: OpenApi.OpenAPISpecMethodName;
  path: string;
}

export type AnyHandler<R = never> = Handler<any, any, any, any, R>;
