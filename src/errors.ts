export type NotFoundError = { _tag: "NotFoundError"; error: unknown };
export type InvalidQueryError = { _tag: "InvalidQueryError"; error: unknown };
export type InvalidParamsError = { _tag: "InvalidParamsError"; error: unknown };
export type InvalidBodyError = { _tag: "InvalidBodyError"; error: unknown };
export type InvalidResponseError = {
  _tag: "InvalidResponseError";
  error: unknown;
};
export type ConflictError = {
  _tag: "ConflictError";
  error: unknown;
};
export type ServerError = { _tag: "ServerError"; error: unknown };

export type ApiError =
  | NotFoundError
  | InvalidQueryError
  | InvalidParamsError
  | InvalidBodyError
  | InvalidResponseError
  | ConflictError
  | ServerError;

export const notFoundError = (error: unknown): NotFoundError =>
  ({ _tag: "NotFoundError", error } as const);

export const serverError = (error: unknown): ServerError =>
  ({ _tag: "ServerError", error } as const);

export const invalidQueryError = (error: unknown): InvalidQueryError => ({
  _tag: "InvalidQueryError",
  error,
});

export const invalidParamsError = (error: unknown): InvalidParamsError => ({
  _tag: "InvalidParamsError",
  error,
});

export const invalidBodyError = (error: unknown): InvalidBodyError => ({
  _tag: "InvalidBodyError",
  error,
});

export const invalidResponseError = (error: unknown): InvalidResponseError => ({
  _tag: "InvalidResponseError",
  error,
});

export const conflictError = (error: unknown): ConflictError => ({
  _tag: "ConflictError",
  error,
});

const checkByTag =
  <T extends { _tag: string }>(tag: T["_tag"]) =>
  (error: unknown): error is T =>
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === tag;

export const isNotFoundError = checkByTag<NotFoundError>("NotFoundError");

export const isServerError = checkByTag<ServerError>("ServerError");

export const isInvalidQueryError =
  checkByTag<InvalidQueryError>("InvalidQueryError");

export const isInvalidParamsError =
  checkByTag<InvalidParamsError>("InvalidParamsError");

export const isInvalidBodyError =
  checkByTag<InvalidBodyError>("InvalidBodyError");

export const isInvalidResponseError = checkByTag<InvalidResponseError>(
  "InvalidResponseError",
);

export const isConflictError = checkByTag<ConflictError>("ConflictError");
