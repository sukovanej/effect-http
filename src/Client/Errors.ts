export type InvalidUrlClientError = {
  _tag: "InvalidUrlClientError";
  error: unknown;
};

export const invalidUrlError = (error: unknown): InvalidUrlClientError => ({
  _tag: "InvalidUrlClientError",
  error,
});

export type UnexpectedClientError = {
  _tag: "UnexpectedClientError";
  error: unknown;
};

export const unexpectedClientError = (
  error: unknown,
): UnexpectedClientError => ({
  _tag: "UnexpectedClientError",
  error,
});

export type ValidationClientError = {
  _tag: "ValidationClientError";
  error: unknown;
};

export const validationClientError = (
  error: unknown,
): ValidationClientError => ({
  _tag: "ValidationClientError",
  error,
});

export type HttpClientError = {
  _tag: "HttpClientError";
  statusCode: number;
  error: unknown;
};

export const httpClientError = (
  error: unknown,
  statusCode: number,
): HttpClientError => ({
  _tag: "HttpClientError",
  statusCode,
  error,
});

export type ClientError =
  | InvalidUrlClientError
  | HttpClientError
  | ValidationClientError
  | UnexpectedClientError;
