/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */
import type * as PlatformClientError from "@effect/platform/Http/ClientError";
import type * as ParseResult from "@effect/schema/ParseResult";
import { formatParseError } from "effect-http/internal/formatParseError";
import * as Data from "effect/Data";

/** @ignore */
type RequestLocation = "body" | "query" | "params" | "headers";

/**
 * @category errors
 * @since 1.0.0
 */
export class HttpClientError extends Data.TaggedError("HttpClientError")<{
  message: string;
  error: unknown;
  status: number;
}> {
  /**
   * @category errors
   * @since 1.0.0
   */
  static create(error: unknown, status: number) {
    return new HttpClientError({
      message: typeof error === "string" ? error : JSON.stringify(error),
      error,
      status,
    });
  }
}

/**
 * @category errors
 * @since 1.0.0
 */
export class RequestEncodeError extends Data.TaggedError("RequestEncodeError")<{
  message: string;
  error: ParseResult.ParseError;
  location: RequestLocation;
}> {
  /**
   * @category errors
   * @since 1.0.0
   */
  static fromParseError(location: RequestLocation) {
    return (error: ParseResult.ParseError) =>
      new RequestEncodeError({
        message: `Failed to encode ${location}. ${formatParseError(error)}`,
        error,
        location,
      });
  }
}

/**
 * @category errors
 * @since 1.0.0
 */
export class ResponseValidationError extends Data.TaggedError(
  "ResponseValidationError",
)<{
  message: string;
  error: ParseResult.ParseError;
  location: RequestLocation;
}> {
  /**
   * @category errors
   * @since 1.0.0
   */
  static fromParseError(location: RequestLocation) {
    return (error: ParseResult.ParseError) =>
      new ResponseValidationError({
        message: `Failed to validate response ${location}. ${formatParseError(
          error,
        )}`,
        error,
        location,
      });
  }
}

/**
 * @category errors
 * @since 1.0.0
 */
export class ResponseError extends Data.TaggedError("ResponseError")<{
  message: string;
  error: PlatformClientError.ResponseError;
}> {
  /**
   * @category errors
   * @since 1.0.0
   */
  static fromResponseError(error: PlatformClientError.ResponseError) {
    return new ResponseError({
      message: `Invalid response: ${error.reason}`,
      error,
    });
  }
}

/**
 * @category models
 * @since 1.0.0
 */
export type ClientError =
  | HttpClientError
  | ResponseValidationError
  | RequestEncodeError
  | ResponseError;
