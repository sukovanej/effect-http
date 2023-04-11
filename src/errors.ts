export type NotFoundError = { _tag: "NotFoundError"; error: unknown };
export type InvalidQueryError = { _tag: "InvalidQueryError"; error: unknown };
export type InvalidParamsError = { _tag: "InvalidParamsError"; error: unknown };
export type InvalidBodyError = { _tag: "InvalidBodyError"; error: unknown };
export type InvalidResponseError = {
  _tag: "InvalidResponseError";
  error: unknown;
};
export type ServerError = { _tag: "ServerError"; error: unknown };
export type UnexpectedServerError = {
  _tag: "UnexpectedServerError";
  error: unknown;
};

export type ApiError =
  | NotFoundError
  | InvalidQueryError
  | InvalidParamsError
  | InvalidBodyError
  | InvalidResponseError
  | ServerError
  | UnexpectedServerError;

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

export const unexpectedServerError = (
  error: unknown,
): UnexpectedServerError => ({
  _tag: "UnexpectedServerError",
  error,
});
