/**
 * Server errors.
 *
 * @since 1.0.0
 */
import * as Predicate from "@effect/data/Predicate";

/** @internal */
const checkByTag =
  <T extends { _tag: string }>(tag: T["_tag"]) =>
  (error: unknown): error is T =>
    Predicate.isTagged(error, tag);

const createError = <T extends { _tag: string; error: unknown }>(
  _tag: T["_tag"],
): [(error: unknown) => T, (error: unknown) => error is T] => {
  return [(error) => ({ _tag, error }) as T, checkByTag(_tag)];
};

/**
 * 400 Bad Request - query parameters validation failed
 *
 * @category models
 * @since 1.0.0
 */
export interface InvalidQueryError {
  _tag: "InvalidQueryError";
  error: unknown;
}

const [invalidQueryError, isInvalidQueryError] =
  createError<InvalidQueryError>("InvalidQueryError");

export {
  /**
   * 400 Bad Request - query parameters validation failed
   *
   * @category constructors
   * @since 1.0.0
   */
  invalidQueryError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isInvalidQueryError,
};

/**
 * 400 Bad Request - path parameters validation failed
 *
 * @category models
 * @since 1.0.0
 */
export interface InvalidParamsError {
  _tag: "InvalidParamsError";
  error: unknown;
}

const [invalidParamsError, isInvalidParamsError] =
  createError<InvalidParamsError>("InvalidParamsError");

export {
  /**
   * 400 Bad Request - path parameters validation failed
   *
   * @category constructors
   * @since 1.0.0
   */
  invalidParamsError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isInvalidParamsError,
};

/**
 * 400 Bad Request - request body validation failed
 *
 * @category models
 * @since 1.0.0
 */
export interface InvalidBodyError {
  _tag: "InvalidBodyError";
  error: unknown;
}

const [invalidBodyError, isInvalidBodyError] =
  createError<InvalidBodyError>("InvalidBodyError");

export {
  /**
   * 400 Bad Request - request body validation failed
   *
   * @category constructors
   * @since 1.0.0
   */
  invalidBodyError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isInvalidBodyError,
};

/**
 * 400 Bad Request - request headers validation failed
 *
 * @category models
 * @since 1.0.0
 */
export interface InvalidHeadersError {
  _tag: "InvalidHeadersError";
  error: unknown;
}

const [invalidHeadersError, isInvalidHeadersError] =
  createError<InvalidHeadersError>("InvalidHeadersError");

export {
  /**
   * 400 Bad Request - request headers validation failed
   *
   * @category constructors
   * @since 1.0.0
   */
  invalidHeadersError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isInvalidHeadersError,
};

/**
 * 401 Unauthorized - invalid authentication credentials
 *
 * @category models
 * @since 1.0.0
 */
export interface UnauthorizedError {
  _tag: "UnauthorizedError";
  error: unknown;
}

const [unauthorizedError, isUnauthorizedError] =
  createError<UnauthorizedError>("UnauthorizedError");

export {
  /**
   * 401 Unauthorized - invalid authentication credentials
   *
   * @category constructors
   * @since 1.0.0
   */
  unauthorizedError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isUnauthorizedError,
};

/**
 * 403 Forbidden - authorization failure
 *
 * @category models
 * @since 1.0.0
 */
export interface ForbiddenError {
  _tag: "ForbiddenError";
  error: unknown;
}

const [forbiddenError, isForbiddenError] =
  createError<ForbiddenError>("ForbiddenError");

export {
  /**
   * 403 Forbidden - authorization failure
   *
   * @category constructors
   * @since 1.0.0
   */
  forbiddenError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isForbiddenError,
};

/**
 * 404 Not Found - cannot find the requested resource
 *
 * @category models
 * @since 1.0.0
 */
export interface NotFoundError {
  _tag: "NotFoundError";
  error: unknown;
}

const [notFoundError, isNotFoundError] =
  createError<NotFoundError>("NotFoundError");

export {
  /**
   * 404 Not Found - cannot find the requested resource
   *
   * @category constructors
   * @since 1.0.0
   */
  notFoundError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isNotFoundError,
};

/**
 * 409 Conflict - request conflicts with the current state of the server
 *
 * @category models
 * @since 1.0.0
 */
export interface ConflictError {
  _tag: "ConflictError";
  error: unknown;
}

const [conflictError, isConflictError] =
  createError<ConflictError>("ConflictError");

export {
  /**
   * 409 Conflict - request conflicts with the current state of the server
   *
   * @category constructors
   * @since 1.0.0
   */
  conflictError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isConflictError,
};

/**
 * 415 Unsupported Media Type - unsupported payload format
 *
 * @category models
 * @since 1.0.0
 */
export interface UnsupportedMediaTypeError {
  _tag: "UnsupportedMediaTypeError";
  error: unknown;
}

const [unsupportedMediaTypeError, isUnsupportedMediaTypeError] =
  createError<UnsupportedMediaTypeError>("UnsupportedMediaTypeError");

export {
  /**
   * 415 Unsupported Media Type - unsupported payload format
   *
   * @category constructors
   * @since 1.0.0
   */
  unsupportedMediaTypeError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isUnsupportedMediaTypeError,
};

/**
 * 429 Too Many Requests - the user has sent too many requests in a given amount of time
 *
 * @category models
 * @since 1.0.0
 */
export interface TooManyRequestsError {
  _tag: "TooManyRequestsError";
  error: unknown;
}

const [tooManyRequestsError, isTooManyRequestsError] =
  createError<TooManyRequestsError>("TooManyRequestsError");

export {
  /**
   * 429 Too Many Requests - the user has sent too many requests in a given amount of time
   *
   * @category constructors
   * @since 1.0.0
   */
  tooManyRequestsError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isTooManyRequestsError,
};

/**
 * 500 Internal Server Error - response validation failed
 *
 * @category models
 * @since 1.0.0
 */
export interface InvalidResponseError {
  _tag: "InvalidResponseError";
  error: unknown;
}

const [invalidResponseError, isInvalidResponseError] =
  createError<InvalidResponseError>("InvalidResponseError");

export {
  /**
   * 500 Internal Server Error - response validation failed
   *
   * @category constructors
   * @since 1.0.0
   */
  invalidResponseError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isInvalidResponseError,
};

/**
 * 500 Internal Server Error - internal server error
 *
 * @category models
 * @since 1.0.0
 */
export interface InternalServerError {
  _tag: "InternalServerError";
  error: unknown;
}

const [internalServerError, isInternalServerError] =
  createError<InternalServerError>("InternalServerError");

export {
  /**
   * 500 Internal Server Error - internal server error
   *
   * @category constructors
   * @since 1.0.0
   */
  internalServerError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isInternalServerError,
};

/**
 * 501 Not Implemented - functionality to fulfill the request is not supported
 *
 * @category models
 * @since 1.0.0
 */
export interface NotImplementedError {
  _tag: "NotImplementedError";
  error: unknown;
}

const [notImplementedError, isNotImplementedError] =
  createError<NotImplementedError>("NotImplementedError");

export {
  /**
   * 501 Not Implemented - functionality to fulfill the request is not supported
   *
   * @category constructors
   * @since 1.0.0
   */
  notImplementedError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isNotImplementedError,
};

/**
 * 502 Bad Gateway - invalid response from the upstream server
 *
 * @category models
 * @since 1.0.0
 */
export interface BadGatewayError {
  _tag: "BadGatewayError";
  error: unknown;
}

const [badGatewayError, isBadGatewayError] =
  createError<BadGatewayError>("BadGatewayError");

export {
  /**
   * 502 Bad Gateway - invalid response from the upstream server
   *
   * @category constructors
   * @since 1.0.0
   */
  badGatewayError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isBadGatewayError,
};

/**
 * 503 Service Unavailable - server is not ready to handle the request
 *
 * @category models
 * @since 1.0.0
 */
export interface ServiceUnavailableError {
  _tag: "ServiceUnavailableError";
  error: unknown;
}

const [serviceUnavailableError, isServiceUnavailableError] =
  createError<ServiceUnavailableError>("ServiceUnavailableError");

export {
  /**
   * 503 Service Unavailable - server is not ready to handle the request
   *
   * @category constructors
   * @since 1.0.0
   */
  serviceUnavailableError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isServiceUnavailableError,
};

/**
 * 504 Service Unavailable - request timeout from the upstream server
 *
 * @category models
 * @since 1.0.0
 */
export interface GatewayTimeoutError {
  _tag: "GatewayTimeoutError";
  error: unknown;
}

const [gatewayTimeoutError, isGatewayTimeoutError] =
  createError<GatewayTimeoutError>("GatewayTimeoutError");

export {
  /**
   * 504 Service Unavailable - request timeout from the upstream server
   *
   * @category constructors
   * @since 1.0.0
   */
  gatewayTimeoutError,
  /**
   * @category refinements
   * @since 1.0.0
   */
  isGatewayTimeoutError,
};

/**
 * @category constants
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
 * @category constants
 * @since 1.0.0
 */
export const API_ERROR_TAGS = Object.getOwnPropertyNames(API_STATUS_CODES);

/**
 * @category refinements
 * @since 1.0.0
 */
export const isApiError = (error: unknown): error is ApiError =>
  Predicate.isRecord(error) &&
  "error" in error &&
  "_tag" in error &&
  Predicate.isString(error._tag) &&
  API_ERROR_TAGS.includes(error._tag);

/**
 * @category models
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
 * @category models
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
 * @category models
 * @since 1.0.0
 */
export type ApiError = ApiClientError | ApiServerError;
