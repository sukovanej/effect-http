import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import type { AnyApi, Endpoint } from "../Api";
import {
  AddServerHandle,
  AnyServer,
  ApiToServer,
  Handler,
  InputHandlerFn,
  ServerUnimplementedIds,
  isResponse,
} from "../Server";
import { ServerId } from "../Server";
import {
  API_STATUS_CODES,
  ApiError,
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
  isConflictError,
  isInvalidBodyError,
  isInvalidHeadersError,
  isInvalidParamsError,
  isInvalidQueryError,
  isInvalidResponseError,
} from "../Server/Errors";
import * as Response from "../Server/Response";
import {
  formatValidationError,
  isParseError,
} from "../Server/ValidationErrorFormatter";
import { SelectEndpointById, getSchema, getStructSchema } from "./utils";

/** @internal */
export const server = <A extends AnyApi>(api: A): ApiToServer<A> =>
  ({
    [ServerId]: {
      _R: (_: never) => _,
    },
    _unimplementedEndpoints: api.endpoints,
    api,

    handlers: [],
  } as unknown as ApiToServer<A>);

/** @internal */
const formatError = (error: unknown) => {
  const isValidationError =
    isInvalidQueryError(error) ||
    isInvalidBodyError(error) ||
    isInvalidResponseError(error) ||
    isInvalidParamsError(error) ||
    isInvalidHeadersError(error) ||
    isConflictError(error);

  if (isValidationError) {
    const innerError = error.error;

    if (isParseError(innerError)) {
      return formatValidationError(innerError);
    } else if (typeof innerError === "string") {
      return Effect.succeed(innerError);
    }
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    if (typeof error.error === "string") {
      return Effect.succeed(error.error);
    }

    return Effect.succeed(JSON.stringify(error.error));
  }

  return Effect.succeed(JSON.stringify(error));
};

/** @internal */
const handleApiFailure = (
  method: string,
  path: string,
  error: ApiError,
  statusCode: number,
) =>
  pipe(
    formatError(error),
    Effect.tap((details) =>
      pipe(
        Effect.logWarning(`${method.toUpperCase()} ${path} failed`),
        Effect.logAnnotate("errorTag", error._tag),
        Effect.logAnnotate("error", details),
      ),
    ),
    Effect.map(
      (details) =>
        Response.response({
          body: {
            error: error._tag,
            details,
          },
          statusCode,
          headers: {},
        }) satisfies Response.Response<unknown, number, Record<string, string>>,
    ),
  );

/** @internal */
const enhanceHandler = (
  fn: InputHandlerFn<Endpoint, any>,
  endpoint: Endpoint,
): Handler => {
  const { schemas, method, path } = endpoint;

  const parseQuery = Schema.parseEffect(getStructSchema(schemas.query));
  const parseParams = Schema.parseEffect(getStructSchema(schemas.params));
  const parseHeaders = Schema.parseEffect(getStructSchema(schemas.headers));
  const parseBody = Schema.parseEffect(getSchema(schemas.body));
  const encodeResponse = Schema.parseEffect(schemas.response);

  const enhancedFn: Handler["fn"] = ({ query, params, body, headers }) =>
    pipe(
      Effect.all({
        query: Effect.mapError(parseQuery(query), invalidQueryError),
        params: Effect.mapError(parseParams(params), invalidParamsError),
        body: Effect.mapError(parseBody(body), invalidBodyError),
        headers: Effect.mapError(parseHeaders(headers), invalidHeadersError),
      }),
      Effect.tap(() => Effect.logTrace(`${method.toUpperCase()} ${path}`)),
      Effect.flatMap(fn),
      Effect.flatMap((response) => {
        let body = response;
        let statusCode = 200;
        let headers: Record<string, string> = {};

        if (isResponse(response)) {
          body = response.body;
          statusCode = response.statusCode ?? statusCode;
          headers = response.headers ?? headers;
        }

        const encodedBody = encodeResponse(body);

        return pipe(
          encodedBody,
          Effect.map((body) =>
            Response.response({ body, statusCode, headers }),
          ),
          Effect.mapError(invalidResponseError),
        );
      }),
      Effect.catchAll((error) =>
        handleApiFailure(method, path, error, API_STATUS_CODES[error._tag]),
      ),
    );

  return { endpoint, fn: enhancedFn };
};

/** @internal */
export const handle =
  <S extends AnyServer, Id extends ServerUnimplementedIds<S>, R>(
    id: Id,
    fn: InputHandlerFn<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>,
  ) =>
  (api: S): AddServerHandle<S, Id, R> => {
    const endpoint = api._unimplementedEndpoints.find(
      ({ id: _id }) => _id === id,
    );

    if (endpoint === undefined) {
      throw new Error(`Operation id ${id} not found`);
    }

    const newUnimplementedEndpoints = api._unimplementedEndpoints.filter(
      ({ id: _id }) => _id !== id,
    );

    const handler = enhanceHandler(fn, endpoint);

    return {
      ...api,
      _unimplementedEndpoints: newUnimplementedEndpoints,
      handlers: [...api.handlers, handler],
    } as unknown as AddServerHandle<S, Id, R>;
  };
