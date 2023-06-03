/**
 * @since 1.0.0
 */
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint } from "effect-http/Api";

import {
  formatValidationError,
  isParseError,
} from "./ValidationErrorFormatter";
import { getSchema, getStructSchema } from "./internal/utils";

/**
 * @category symbols
 * @since 1.0.0
 */
export const ServerId = Symbol("effect-http/Server/Server");

/**
 * @category models
 * @since 1.0.0
 */
export type ServerId = typeof ServerId;

/**
 * @category models
 * @since 1.0.0
 */
export type Server<
  R,
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
> = {
  readonly [ServerId]: {
    readonly _R: (_: never) => R;
  };

  _unimplementedEndpoints: UnimplementedEndpoints;

  handlers: Handler<R>[];
  api: Api;
};

type NonIgnoredFields<K extends keyof A, A> = K extends any
  ? A[K] extends
      | Schema.Schema<any, any>
      | Record<string, Schema.Schema<any, any>>
    ? K
    : never
  : never;

type RemoveIgnoredSchemas<E> = Pick<E, NonIgnoredFields<keyof E, E>>;

type SchemaStructTo<A> = {
  [K in keyof A]: K extends "query" | "params" | "headers"
    ? A[K] extends Record<string, Schema.Schema<any>>
      ? { [KQ in keyof A[K]]: Schema.To<A[K][KQ]> }
      : never
    : A[K] extends Schema.Schema<any, infer X>
    ? X
    : never;
};

/**
 * @category models
 * @since 1.0.0
 */
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;

/**
 * @category models
 * @since 1.0.0
 */
export type EndpointSchemasToInput<E extends Endpoint["schemas"]> =
  Schema.Spread<SchemaStructTo<RemoveIgnoredSchemas<Omit<E, "response">>>>;

/**
 * @category models
 * @since 1.0.0
 */
export type InputHandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E["schemas"]>,
) => Effect.Effect<R, ApiError, HandlerResponse<E["schemas"]["response"]>>;

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerInput<Q, P, H, B> = {
  query: Q;
  params: P;
  headers: H;
  body: B;
};

/**
 * @category models
 * @since 1.0.0
 */
export type Handler<R = any> = {
  fn: (request: Request) => Effect.Effect<R, never, Response>;

  endpoint: Endpoint;
};

/** @ignore */
export type ApiToServer<A extends Api> = A extends Api<infer Es>
  ? Server<never, Es>
  : never;

type DropEndpoint<Es extends Endpoint[], Id extends string> = Es extends [
  infer First,
  ...infer Rest,
]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : [];

/** @ignore */
export type ServerUnimplementedIds<S extends Server<any>> =
  S["_unimplementedEndpoints"][number]["id"];

/** @ignore */
export type AddServerHandle<
  S extends Server<any>,
  Id extends ServerUnimplementedIds<S>,
  R,
> = S extends Server<infer R0, infer E>
  ? Server<R0 | R, DropEndpoint<E, Id>>
  : never;

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerResponse<S extends Schema.Schema<any, any>> =
  S extends Schema.Schema<any, infer Body> ? Response | Body : never;

/**
 * Create new unimplemeted `Server` from `Api`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const server = <A extends Api>(api: A): ApiToServer<A> =>
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
  status: number,
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
    Effect.map((details) => {
      const body = JSON.stringify({ error: error._tag, details });
      return new Response(body, {
        status,
        headers: new Headers({ "Content-Type": "application/json" }),
      });
    }),
  );

/** @internal */
const createParamsMatcher = (path: string) => {
  // based on https://github.com/kwhitley/itty-router/blob/73148972bf2e205a4969e85672e1c0bfbf249c27/src/itty-router.js
  const matcher = RegExp(
    `^${path
      .replace(/(\/?)\*/g, "($1.*)?")
      .replace(/\/$/, "")
      .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3")
      .replace(/\.(?=[\w(])/, "\\.")
      .replace(/\)\.\?\(([^[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.")}/*$`,
  );
  return (url: URL): Record<string, string> => {
    const match = url.pathname.match(matcher as RegExp);
    return (match && match.groups) || {};
  };
};

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
  const encodeResponse = Schema.encodeEffect(schemas.response);

  const getRequestParams = createParamsMatcher(path);

  const enhancedFn: Handler["fn"] = (request) => {
    const url = new URL(request.url);
    const query = Array.from(url.searchParams.entries()).reduce(
      (acc, [name, value]) => ({ ...acc, [name]: value }),
      {},
    );
    const headers = Array.from(request.headers.entries()).reduce(
      (acc, [name, value]) => ({ ...acc, [name]: value }),
      {},
    );

    const contentLengthHeader = request.headers.get("content-length");
    const contentTypeHeader = request.headers.get("content-type");
    const contentLength =
      contentLengthHeader === null ? 0 : parseInt(contentLengthHeader);

    return pipe(
      Effect.tryCatchPromise(
        () => {
          if (contentLength > 0) {
            if (contentTypeHeader?.startsWith("application/json")) {
              return request.json();
            } else {
              return request.text();
            }
          }
          return Promise.resolve(undefined);
        },
        (err) =>
          internalServerError(
            `Cannot get request JSON, ${err}, ${request.body}`,
          ),
      ),
      Effect.flatMap((body) =>
        Effect.all({
          query: Effect.mapError(parseQuery(query), invalidQueryError),
          params: Effect.mapError(
            parseParams(getRequestParams(url)),
            invalidParamsError,
          ),
          body: Effect.mapError(parseBody(body), invalidBodyError),
          headers: Effect.mapError(parseHeaders(headers), invalidHeadersError),
        }),
      ),
      Effect.tap(() =>
        Effect.logTrace(`${method.toUpperCase()} ${url.pathname}`),
      ),
      Effect.flatMap(fn),
      Effect.flatMap((response) => {
        const status =
          response instanceof Response ? response.status : undefined;
        const headers =
          response instanceof Response
            ? response.headers
            : new Headers({ "content-type": "application/json" });

        return pipe(
          Effect.promise(() =>
            response instanceof Response
              ? response.json()
              : Promise.resolve(response),
          ),
          Effect.flatMap((body) => encodeResponse(body)),
          Effect.map(
            (body) => new Response(JSON.stringify(body), { status, headers }),
          ),
          Effect.mapError(invalidResponseError),
        );
      }),
      Effect.catchAll((error) =>
        handleApiFailure(method, path, error, API_STATUS_CODES[error._tag]),
      ),
    );
  };

  return { endpoint, fn: enhancedFn };
};

/**
 * Implement handler for the given operation id.
 *
 * @category combinators
 * @since 1.0.0
 */
export const handle =
  <S extends Server<any>, Id extends ServerUnimplementedIds<S>, R>(
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

/**
 * Make sure that all the endpoints are implemented
 *
 * @category combinators
 * @since 1.0.0
 */
export const exhaustive = <R>(server: Server<R, []>): Server<R, []> => server;

/**
 * Type-helper providing type of a handler input given the type of the
 * Api `A` and operation id `Id`.
 *
 * ```
 * import * as Http from 'effect-http';
 * const api = pipe(
 *   Http.api(),
 *   Http.get("getMilan", "/milan", { response: Schema.string, query: Schema.string })
 * )
 *
 * type GetMilanInput = Http.Input<typeof api, "getMilan">
 * // -> { query: string }
 * ```
 *
 * @param A Api type of the API
 * @param Id operation id
 *
 * @category type helpers
 * @since 1.0.0
 */
export type Input<
  A extends Api,
  Id extends A["endpoints"][number]["id"],
> = EndpointSchemasToInput<
  Extract<A["endpoints"][number], { id: Id }>["schemas"]
>;

const checkByTag =
  <T extends { _tag: string }>(tag: T["_tag"]) =>
  (error: unknown): error is T =>
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === tag;

const createError = <T extends { _tag: string; error: unknown }>(
  _tag: T["_tag"],
): [(error: unknown) => T, (error: unknown) => error is T] => {
  return [(error) => ({ _tag, error } as T), checkByTag(_tag)];
};

//

/**
 * 400 Bad Request - query parameters validation failed
 *
 * @category error models
 * @since 1.0.0
 */
export type InvalidQueryError = { _tag: "InvalidQueryError"; error: unknown };

const [invalidQueryError, isInvalidQueryError] =
  createError<InvalidQueryError>("InvalidQueryError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  invalidQueryError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isInvalidQueryError,
};

/**
 * 400 Bad Request - path parameters validation failed
 *
 * @category error models
 * @since 1.0.0
 */
export type InvalidParamsError = { _tag: "InvalidParamsError"; error: unknown };

const [invalidParamsError, isInvalidParamsError] =
  createError<InvalidParamsError>("InvalidParamsError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  invalidParamsError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isInvalidParamsError,
};

/**
 * 400 Bad Request - request body validation failed
 *
 * @category error models
 * @since 1.0.0
 */
export type InvalidBodyError = { _tag: "InvalidBodyError"; error: unknown };
const [invalidBodyError, isInvalidBodyError] =
  createError<InvalidBodyError>("InvalidBodyError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  invalidBodyError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isInvalidBodyError,
};

/**
 * 400 Bad Request - request headers validation failed
 *
 * @category error models
 * @since 1.0.0
 */
export type InvalidHeadersError = {
  _tag: "InvalidHeadersError";
  error: unknown;
};

const [invalidHeadersError, isInvalidHeadersError] =
  createError<InvalidHeadersError>("InvalidHeadersError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  invalidHeadersError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isInvalidHeadersError,
};

/**
 * 401 Unauthorized - invalid authentication credentials
 *
 * @category error models
 * @since 1.0.0
 */
export type UnauthorizedError = { _tag: "UnauthorizedError"; error: unknown };

const [unauthorizedError, isUnauthorizedError] =
  createError<UnauthorizedError>("UnauthorizedError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  unauthorizedError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isUnauthorizedError,
};

/**
 * 403 Forbidden - authorization failure
 *
 * @category error models
 * @since 1.0.0
 */
export type ForbiddenError = { _tag: "ForbiddenError"; error: unknown };

const [forbiddenError, isForbiddenError] =
  createError<ForbiddenError>("ForbiddenError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  forbiddenError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isForbiddenError,
};

/**
 * 404 Not Found - cannot find the requested resource
 *
 * @category error models
 * @since 1.0.0
 */
export type NotFoundError = { _tag: "NotFoundError"; error: unknown };

const [notFoundError, isNotFoundError] =
  createError<NotFoundError>("NotFoundError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  notFoundError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isNotFoundError,
};

/**
 * 409 Conflict - request conflicts with the current state of the server
 *
 * @category error models
 * @since 1.0.0
 */
export type ConflictError = {
  _tag: "ConflictError";
  error: unknown;
};

const [conflictError, isConflictError] =
  createError<ConflictError>("ConflictError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  conflictError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isConflictError,
};

/**
 * 415 Unsupported Media Type - unsupported payload format
 *
 * @category error models
 * @since 1.0.0
 */
export type UnsupportedMediaTypeError = {
  _tag: "UnsupportedMediaTypeError";
  error: unknown;
};

const [unsupportedMediaTypeError, isUnsupportedMediaTypeError] =
  createError<UnsupportedMediaTypeError>("UnsupportedMediaTypeError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  unsupportedMediaTypeError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isUnsupportedMediaTypeError,
};

/**
 * 429 Too Many Requests - the user has sent too many requests in a given amount of time
 *
 * @category error models
 * @since 1.0.0
 */
export type TooManyRequestsError = {
  _tag: "TooManyRequestsError";
  error: unknown;
};

const [tooManyRequestsError, isTooManyRequestsError] =
  createError<TooManyRequestsError>("TooManyRequestsError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  tooManyRequestsError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isTooManyRequestsError,
};

/**
 * 500 Internal Server Error - response validation failed
 *
 * @category error models
 * @since 1.0.0
 */
export type InvalidResponseError = {
  _tag: "InvalidResponseError";
  error: unknown;
};

const [invalidResponseError, isInvalidResponseError] =
  createError<InvalidResponseError>("InvalidResponseError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  invalidResponseError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isInvalidResponseError,
};

/**
 * 500 Internal Server Error - internal server error
 *
 * @category error models
 * @since 1.0.0
 */
export type InternalServerError = {
  _tag: "InternalServerError";
  error: unknown;
};

const [internalServerError, isInternalServerError] =
  createError<InternalServerError>("InternalServerError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  internalServerError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isInternalServerError,
};

/**
 * 501 Not Implemented - functionality to fulfill the request is not supported
 *
 * @category error models
 * @since 1.0.0
 */
export type NotImplementedError = {
  _tag: "NotImplementedError";
  error: unknown;
};

const [notImplementedError, isNotImplementedError] =
  createError<NotImplementedError>("NotImplementedError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  notImplementedError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isNotImplementedError,
};

/**
 * 502 Bad Gateway - invalid response from the upstream server
 *
 * @category error models
 * @since 1.0.0
 */
export type BadGatewayError = {
  _tag: "BadGatewayError";
  error: unknown;
};

const [badGatewayError, isBadGatewayError] =
  createError<BadGatewayError>("BadGatewayError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  badGatewayError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isBadGatewayError,
};

/**
 * 503 Service Unavailable - server is not ready to handle the request
 *
 * @category error models
 * @since 1.0.0
 */
export type ServiceUnavailableError = {
  _tag: "ServiceUnavailableError";
  error: unknown;
};

const [serviceUnavailableError, isServiceUnavailableError] =
  createError<ServiceUnavailableError>("ServiceUnavailableError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  serviceUnavailableError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isServiceUnavailableError,
};

/**
 * 504 Service Unavailable - request timeout from the upstream server
 *
 * @category error models
 * @since 1.0.0
 */
export type GatewayTimeoutError = {
  _tag: "GatewayTimeoutError";
  error: unknown;
};

const [gatewayTimeoutError, isGatewayTimeoutError] =
  createError<GatewayTimeoutError>("GatewayTimeoutError");

export {
  /**
   * @category error constructors
   * @since 1.0.0
   */
  gatewayTimeoutError,
  /**
   * @category error refinements
   * @since 1.0.0
   */
  isGatewayTimeoutError,
};

/**
 * @category error constants
 * @since 1.0.0
 */
export const API_STATUS_CODES: Record<ApiError["_tag"], number> = {
  InvalidQueryError: 400,
  InvalidParamsError: 400,
  InvalidBodyError: 400,
  InvalidHeadersError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  UnsupportedMediaTypeError: 415,
  TooManyRequestsError: 429,
  InvalidResponseError: 500,
  InternalServerError: 500,
  NotImplementedError: 501,
  BadGatewayError: 502,
  ServiceUnavailableError: 503,
  GatewayTimeoutError: 504,
};

/**
 * @category error constants
 * @since 1.0.0
 */
export const API_ERROR_TAGS = Object.getOwnPropertyNames(API_STATUS_CODES);

/**
 * @category error refinements
 * @since 1.0.0
 */
export const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" &&
  error !== null &&
  "error" in error &&
  "_tag" in error &&
  typeof error._tag === "string" &&
  API_ERROR_TAGS.includes(error._tag);

/**
 * @category error models
 * @since 1.0.0
 */
export type ApiClientError =
  | InvalidQueryError
  | InvalidParamsError
  | InvalidBodyError
  | InvalidHeadersError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError
  | UnsupportedMediaTypeError
  | TooManyRequestsError;

/**
 * @category error models
 * @since 1.0.0
 */
export type ApiServerError =
  | InvalidResponseError
  | InternalServerError
  | NotImplementedError
  | BadGatewayError
  | ServiceUnavailableError
  | GatewayTimeoutError;

/**
 * @category error models
 * @since 1.0.0
 */
export type ApiError = ApiClientError | ApiServerError;
