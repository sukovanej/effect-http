const checkByTag =
  <T extends { _tag: string }>(tag: T["_tag"]) =>
  (error: unknown): error is T =>
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === tag;

const createError =
  <T extends { _tag: string; error: unknown }>(_tag: T["_tag"]) =>
  (error: unknown): T =>
    ({ _tag, error } as T);

/** 400 Bad Request query parameters validation failed */
export type InvalidQueryError = { _tag: "InvalidQueryError"; error: unknown };

/** 400 Bad Request query parameters validation failed */
export const invalidQueryError =
  createError<InvalidQueryError>("InvalidQueryError");

/** `InvalidQueryError` refinement */
export const isInvalidQueryError =
  checkByTag<InvalidQueryError>("InvalidQueryError");

/** 400 Bad Request path parameters validation failed */
export type InvalidParamsError = { _tag: "InvalidParamsError"; error: unknown };

/** 400 Bad Request path parameters validation failed */
export const invalidParamsError =
  createError<InvalidQueryError>("InvalidQueryError");

/** `InvalidParamsError` refinement */
export const isInvalidParamsError =
  checkByTag<InvalidParamsError>("InvalidParamsError");

/** 400 Bad Request - request body validation failed */
export type InvalidBodyError = { _tag: "InvalidBodyError"; error: unknown };

/** 400 Bad Request - request body validation failed */
export const invalidBodyError =
  createError<InvalidBodyError>("InvalidBodyError");

/** `InvalidBodyError` refinement */
export const isInvalidBodyError =
  checkByTag<InvalidBodyError>("InvalidBodyError");

/** 401 Unauthorized - request body validation failed */
export type UnauthorizedError = { _tag: "UnauthorizedError"; error: unknown };

/** 401 Bad Request - request body validation failed */
export const unauthorizedError =
  createError<UnauthorizedError>("UnauthorizedError");

/** `UnauthorizedError` refinement */
export const isUnauthorizedError =
  checkByTag<UnauthorizedError>("UnauthorizedError");

/** 404 Not Found - cannot find the requested resource */
export type NotFoundError = { _tag: "NotFoundError"; error: unknown };

/** 404 Not Found - cannot find the requested resource */
export const notFoundError = createError<NotFoundError>("NotFoundError");

/** `NotFoundError` refinement */
export const isNotFoundError = checkByTag<NotFoundError>("NotFoundError");

/** 409 Conflict - request conflicts with the current state of the server */
export type ConflictError = {
  _tag: "ConflictError";
  error: unknown;
};

/** 409 Conflict - request conflicts with the current state of the server */
export const conflictError = createError<ConflictError>("ConflictError");

/** `ConflictError` refinement */
export const isConflictError = checkByTag<ConflictError>("ConflictError");

/** 500 Internal Server Error - response validation failed */
export type InvalidResponseError = {
  _tag: "InvalidResponseError";
  error: unknown;
};

/** 500 Internal Server Error - response validation failed */
export const invalidResponseError = createError<InvalidResponseError>(
  "InvalidResponseError",
);

/** `InvalidResponseError` refinement */
export const isInvalidResponseError = checkByTag<InvalidResponseError>(
  "InvalidResponseError",
);

/** 500 Internal Server Error - any server failure */
export type InternalServerError = {
  _tag: "InternalServerError";
  error: unknown;
};

/** 500 Internal Server Error - any server failure */
export const internalServerError = createError<InternalServerError>(
  "InternalServerError",
);

/** `InvalidResponseError` refinement */
export const isInternalServerError = checkByTag<InternalServerError>(
  "InternalServerError",
);

export type ApiError =
  | InvalidQueryError
  | InvalidParamsError
  | InvalidBodyError
  | UnauthorizedError
  | NotFoundError
  | ConflictError
  | InvalidResponseError
  | InternalServerError;
