/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */
import { HttpClient } from "@effect/platform";
import { ParseResult } from "@effect/schema";
import { Data } from "effect";
import { formatParseError } from "effect-http/internal/formatParseError";

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
      message: `Http error with status code ${status}.`,
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
  error: HttpClient.error.ResponseError;
}> {
  /**
   * @category errors
   * @since 1.0.0
   */
  static fromResponseError(error: HttpClient.error.ResponseError) {
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
