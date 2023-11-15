/**
 * Server errors.
 *
 * @since 1.0.0
 */
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import * as Data from "effect/Data";
import * as Predicate from "effect/Predicate";

/**
 * @category errors
 * @since 1.0.0
 */
export class ServerError extends Data.TaggedError("ServerError")<{
  status: number;
  text?: string;
  json?: unknown;
}> {
  /**
   * @category errors
   * @since 1.0.0
   */
  toServerResponse() {
    const options = { status: this.status };

    if (this.json !== undefined) {
      return ServerResponse.unsafeJson(this.json, options);
    } else if (this.text !== undefined) {
      return ServerResponse.text(this.text, options);
    }

    return ServerResponse.empty(options);
  }
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make = (status: number, body?: unknown) => {
  if (body === undefined) {
    return new ServerError({ status });
  }

  if (typeof body === "string") {
    return new ServerError({ status, text: body });
  }

  return new ServerError({ status, json: body });
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeText = (status: number, text: string) =>
  new ServerError({ status, text });

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeJson = (status: number, json: unknown) =>
  new ServerError({ status, json });

/**
 * @category errors
 * @since 1.0.0
 */
export const isServerError = (error: unknown): error is ServerError =>
  Predicate.isObject(error) &&
  "_tag" in error &&
  error["_tag"] === "ServerError";

/**
 * @category constructors
 * @since 1.0.0
 */
export const badRequest = (body: unknown) => make(401, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const unauthorizedError = (body: unknown) => make(401, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const forbiddenError = (body: unknown) => make(403, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const notFoundError = (body: unknown) => make(404, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const conflictError = (body: unknown) => make(409, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const unsupportedMediaTypeError = (body: unknown) => make(415, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const tooManyRequestsError = (body: unknown) => make(429, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const internalServerError = (body: unknown) => make(500, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const notImplementedError = (body: unknown) => make(501, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const badGatewayError = (body: unknown) => make(502, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const serviceUnavailableError = (body: unknown) => make(503, body);

/**
 * @category constructors
 * @since 1.0.0
 */
export const gatewayTimeoutError = (body: unknown) => make(504, body);
