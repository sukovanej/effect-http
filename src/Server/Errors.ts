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

// 400 Bad Request - query parameters validation failed

export type InvalidQueryError = { _tag: "InvalidQueryError"; error: unknown };
export const [invalidQueryError, isInvalidQueryError] =
  createError<InvalidQueryError>("InvalidQueryError");

// 400 Bad Request - path parameters validation failed

export type InvalidParamsError = { _tag: "InvalidParamsError"; error: unknown };
export const [invalidParamsError, isInvalidParamsError] =
  createError<InvalidParamsError>("InvalidParamsError");

// 400 Bad Request - request body validation failed

export type InvalidBodyError = { _tag: "InvalidBodyError"; error: unknown };
export const [invalidBodyError, isInvalidBodyError] =
  createError<InvalidBodyError>("InvalidBodyError");

// 400 Bad Request - request headers validation failed

export type InvalidHeadersError = {
  _tag: "InvalidHeadersError";
  error: unknown;
};
export const [invalidHeadersError, isInvalidHeadersError] =
  createError<InvalidHeadersError>("InvalidHeadersError");

// 401 Unauthorized - invalid authentication credentials

export type UnauthorizedError = { _tag: "UnauthorizedError"; error: unknown };
export const [unauthorizedError, isUnauthorizedError] =
  createError<UnauthorizedError>("UnauthorizedError");

// 403 Forbidden - authorization failure

export type ForbiddenError = { _tag: "ForbiddenError"; error: unknown };
export const [forbiddenError, isForbiddenError] =
  createError<ForbiddenError>("ForbiddenError");

// 404 Not Found - cannot find the requested resource

export type NotFoundError = { _tag: "NotFoundError"; error: unknown };
export const [notFoundError, isNotFoundError] =
  createError<NotFoundError>("NotFoundError");

// 409 Conflict - request conflicts with the current state of the server

export type ConflictError = {
  _tag: "ConflictError";
  error: unknown;
};
export const [conflictError, isConflictError] =
  createError<ConflictError>("ConflictError");

// 415 Unsupported Media Type - unsupported payload format

export type UnsupportedMediaTypeError = {
  _tag: "UnsupportedMediaTypeError";
  error: unknown;
};
export const [unsupportedMediaTypeError, isUnsupportedMediaTypeError] =
  createError<UnsupportedMediaTypeError>("UnsupportedMediaTypeError");

// 429 Too Many Requests - the user has sent too many requests in a given amount of time

export type TooManyRequestsError = {
  _tag: "TooManyRequestsError";
  error: unknown;
};
export const [tooManyRequestsError, isTooManyRequestsError] =
  createError<TooManyRequestsError>("TooManyRequestsError");

// 500 Internal Server Error - response validation failed

export type InvalidResponseError = {
  _tag: "InvalidResponseError";
  error: unknown;
};
export const [invalidResponseError, isInvalidResponseError] =
  createError<InvalidResponseError>("InvalidResponseError");

// 500 Internal Server Error - internal server error

export type InternalServerError = {
  _tag: "InternalServerError";
  error: unknown;
};
export const [internalServerError, isInternalServerError] =
  createError<InternalServerError>("InternalServerError");

// 501 Not Implemented - functionality to fulfill the request is not supported

export type NotImplementedError = {
  _tag: "NotImplementedError";
  error: unknown;
};
export const [notImplementedError, isNotImplementedError] =
  createError<NotImplementedError>("NotImplementedError");

// 502 Bad Gateway - invalid response from the upstream server

export type BadGatewayError = {
  _tag: "BadGatewayError";
  error: unknown;
};
export const [badGatewayError, isBadGatewayError] =
  createError<BadGatewayError>("BadGatewayError");

// 503 Service Unavailable - server is not ready to handle the request

export type ServiceUnavailableError = {
  _tag: "ServiceUnavailableError";
  error: unknown;
};
export const [serviceUnavailableError, isServiceUnavailableError] =
  createError<ServiceUnavailableError>("ServiceUnavailableError");

// 504 Service Unavailable - request timeout from the upstream server

export type GatewayTimeoutError = {
  _tag: "GatewayTimeoutError";
  error: unknown;
};
export const [gatewayTimeoutError, isGatewayTimeoutError] =
  createError<GatewayTimeoutError>("GatewayTimeoutError");

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

export const API_ERROR_TAGS = Object.getOwnPropertyNames(API_STATUS_CODES);

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" &&
  error !== null &&
  "error" in error &&
  "_tag" in error &&
  typeof error._tag === "string" &&
  API_ERROR_TAGS.includes(error._tag);

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

export type ApiServerError =
  | InvalidResponseError
  | InternalServerError
  | NotImplementedError
  | BadGatewayError
  | ServiceUnavailableError
  | GatewayTimeoutError;

export type ApiError = ApiClientError | ApiServerError;
