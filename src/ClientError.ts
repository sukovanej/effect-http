/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */

/**
 * @category models
 * @since 1.0.0
 */
export type InvalidUrlClientError = {
  _tag: "InvalidUrlClientError";
  error: unknown;
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const invalidUrlError = (error: unknown): InvalidUrlClientError => ({
  _tag: "InvalidUrlClientError",
  error,
});

/**
 * @category models
 * @since 1.0.0
 */
export type UnexpectedClientError = {
  _tag: "UnexpectedClientError";
  error: unknown;
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const unexpectedClientError = (
  error: unknown,
): UnexpectedClientError => ({
  _tag: "UnexpectedClientError",
  error,
});

/**
 * @category models
 * @since 1.0.0
 */
export type ValidationClientError = {
  _tag: "ValidationClientError";
  error: unknown;
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const validationClientError = (
  error: unknown,
): ValidationClientError => ({
  _tag: "ValidationClientError",
  error,
});

/**
 * @category models
 * @since 1.0.0
 */
export type HttpClientError = {
  _tag: "HttpClientError";
  statusCode: number;
  error: unknown;
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const httpClientError = (
  error: unknown,
  statusCode: number,
): HttpClientError => ({
  _tag: "HttpClientError",
  statusCode,
  error,
});

/**
 * @category models
 * @since 1.0.0
 */
export type ClientError =
  | InvalidUrlClientError
  | HttpClientError
  | ValidationClientError
  | UnexpectedClientError;
