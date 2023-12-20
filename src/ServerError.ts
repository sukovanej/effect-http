/**
 * Server errors.
 *
 * @since 1.0.0
 */
import type * as ServerResponse from "@effect/platform/Http/ServerResponse";
import type * as Cause from "effect/Cause";
import type * as Pipeable from "effect/Pipeable";

import * as internal from "./internal/server-error.js";

/**
 * @category models
 * @since 1.0.0
 */
export interface ServerError extends Cause.YieldableError, Pipeable.Pipeable {
  _tag: "ServerError";
  status: number;
  text?: string;
  json?: unknown;
}

/**
 * @category conversions
 * @since 1.0.0
 */
export const toServerResponse: (
  error: ServerError,
) => ServerResponse.ServerResponse = internal.toServerResponse;

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (status: number, body?: unknown) => ServerError =
  internal.make;

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeText: (status: number, text: string) => ServerError =
  internal.makeText;

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeJson: (status: number, json: unknown) => ServerError =
  internal.makeJson;

/**
 * @category refinements
 * @since 1.0.0
 */
export const isServerError: (error: unknown) => error is ServerError =
  internal.isServerError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const badRequest: (body: unknown) => ServerError = internal.badRequest;

/**
 * @category constructors
 * @since 1.0.0
 */
export const unauthorizedError: (body: unknown) => ServerError =
  internal.unauthorizedError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const forbiddenError: (body: unknown) => ServerError =
  internal.forbiddenError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const notFoundError: (body: unknown) => ServerError =
  internal.notFoundError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const conflictError: (body: unknown) => ServerError =
  internal.conflictError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const unsupportedMediaTypeError: (body: unknown) => ServerError =
  internal.unsupportedMediaTypeError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const tooManyRequestsError: (body: unknown) => ServerError =
  internal.tooManyRequestsError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const internalServerError: (body: unknown) => ServerError =
  internal.internalServerError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const notImplementedError: (body: unknown) => ServerError =
  internal.notImplementedError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const badGatewayError: (body: unknown) => ServerError =
  internal.badGatewayError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const serviceUnavailableError: (body: unknown) => ServerError =
  internal.serviceUnavailableError;

/**
 * @category constructors
 * @since 1.0.0
 */
export const gatewayTimeoutError: (body: unknown) => ServerError =
  internal.gatewayTimeoutError;
