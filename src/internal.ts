import express from "express";
import * as OpenApi from "schema-openapi";

import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import {
  ApiError,
  invalidBodyError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
  unexpectedServerError,
} from "./errors";
import {
  AnyHandler,
  Api,
  FinalHandler,
  HandlerSchemas,
  InputHandler,
} from "./types";
import { AnyInputHandlerSchemas, ComputeHandlerSchemas } from "./types";

export const fillDefaultSchemas = <I extends AnyInputHandlerSchemas>({
  response,
  query,
  params,
  body,
}: I): ComputeHandlerSchemas<I> => ({
  response,
  query: query ?? (S.unknown as ComputeHandlerSchemas<I>["query"]),
  params: params ?? (S.unknown as ComputeHandlerSchemas<I>["params"]),
  body: body ?? (S.unknown as ComputeHandlerSchemas<I>["body"]),
});

const handleApiFailure = (
  method: OpenApi.OpenAPISpecMethodName,
  path: string,
  error: ApiError,
  statusCode: number,
  res: express.Response,
) =>
  pipe(
    Effect.logWarning(`${method} ${path} failed`),
    Effect.logAnnotate("errorTag", error._tag),
    Effect.logAnnotate("error", JSON.stringify(error.error, undefined)),
    Effect.flatMap(() =>
      Effect.try(() =>
        res.status(statusCode).send({
          error: error._tag,
          details: JSON.stringify(error.error, undefined),
        }),
      ),
    ),
    Effect.ignoreLogged,
  );

export const toEndpoint = <Query, Params, Body, Response, R>(
  method: OpenApi.OpenAPISpecMethodName,
  path: string,
  handler: InputHandler<Query, Params, Body, Response, R>,
  schemas: HandlerSchemas<Query, Params, Body, Response>,
): FinalHandler<R> => {
  const parseQuery = S.parseEffect(schemas.query);
  const parseParams = S.parseEffect(schemas.params);
  const parseBody = S.parseEffect(schemas.body);
  const encodeResponse = S.parseEffect(schemas.response);

  return (req: express.Request, res: express.Response) =>
    pipe(
      Effect.Do(),
      Effect.bind("query", () =>
        pipe(parseQuery(req.query), Effect.mapError(invalidQueryError)),
      ),
      Effect.bind("params", () =>
        pipe(parseParams(req.params), Effect.mapError(invalidParamsError)),
      ),
      Effect.bind("body", () =>
        pipe(parseBody(req.body), Effect.mapError(invalidBodyError)),
      ),
      Effect.flatMap(handler),
      Effect.flatMap(
        flow(encodeResponse, Effect.mapError(invalidResponseError)),
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.try(() => {
            res.status(200).send(response);
          }),
          Effect.mapError(unexpectedServerError),
        ),
      ),
      Effect.catchTags({
        InvalidBodyError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidQueryError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidParamsError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidResponseError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        UnexpectedServerError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        NotFoundError: (error) =>
          handleApiFailure(method, path, error, 404, res),
        ServerError: (error) => handleApiFailure(method, path, error, 500, res),
      }),
    );
};

export const handlerToRoute = (handler: AnyHandler): express.Router =>
  express
    .Router()
    [handler.method](handler.path, (req, res) =>
      Effect.runPromise(handler.handler(req, res)),
    );

export const createSpec = (
  self: Api<never>,
): OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType> => {
  return self.handlers.reduce((spec, { path, method, schemas }) => {
    const operationSpec = [];

    if (schemas.response !== S.unknown) {
      operationSpec.push(
        OpenApi.jsonResponse(200, schemas.response, "Response"),
      );
    }

    if (schemas.params !== S.unknown) {
      operationSpec.push(
        OpenApi.parameter("Path parameter", "path", schemas.params),
      );
    }

    if (schemas.query !== S.unknown) {
      operationSpec.push(
        OpenApi.parameter("Query parameter", "query", schemas.query),
      );
    }

    if (schemas.body !== S.unknown) {
      operationSpec.push(OpenApi.jsonRequest(schemas.body));
    }

    return OpenApi.path(
      path,
      OpenApi.operation(method, ...operationSpec),
    )(spec);
  }, self.openApiSpec);
};
