import type { ApiError } from "../Server";

export type InvalidUrlError = {
  _tag: "InvalidUrlError";
  error: unknown;
};

export const invalidUrlError = (error: unknown): InvalidUrlError => ({
  _tag: "InvalidUrlError",
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

export type ClientValidationError = {
  _tag: "ClientValidationError";
  error: unknown;
};

export const clientValidationError = (
  error: unknown,
): ClientValidationError => ({
  _tag: "ClientValidationError",
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
  | ApiError
  | HttpClientError
  | InvalidUrlError
  | UnexpectedClientError;
