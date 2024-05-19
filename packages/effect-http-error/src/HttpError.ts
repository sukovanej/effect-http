/**
 * HTTP errors.
 *
 * @since 1.0.0
 */
import type * as Body from "@effect/platform/Http/Body"
import type * as ServerResponse from "@effect/platform/Http/ServerResponse"
import type * as Cause from "effect/Cause"
import type * as Pipeable from "effect/Pipeable"

import * as internal from "./internal/http-error.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface HttpError extends Cause.YieldableError, Pipeable.Pipeable {
  readonly _tag: "HttpError"
  readonly status: number
  readonly content: Body.Body
}

/**
 * @category destructors
 * @since 1.0.0
 */
export const toResponse: (
  error: HttpError
) => ServerResponse.ServerResponse = internal.toResponse

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (status: number, body?: unknown) => HttpError = internal.make

/**
 * @category refinements
 * @since 1.0.0
 */
export const isHttpError: (error?: unknown) => error is HttpError = internal.isHttpError

/**
 * @category constructors
 * @since 1.0.0
 */
export const badRequest: (body?: unknown) => HttpError = internal.badRequest

/**
 * @category constructors
 * @since 1.0.0
 */
export const unauthorizedError: (body?: unknown) => HttpError = internal.unauthorizedError

/**
 * @category constructors
 * @since 1.0.0
 */
export const forbiddenError: (body?: unknown) => HttpError = internal.forbiddenError

/**
 * @category constructors
 * @since 1.0.0
 */
export const notFoundError: (body?: unknown) => HttpError = internal.notFoundError

/**
 * @category constructors
 * @since 1.0.0
 */
export const conflictError: (body?: unknown) => HttpError = internal.conflictError

/**
 * @category constructors
 * @since 1.0.0
 */
export const unsupportedMediaTypeError: (body?: unknown) => HttpError = internal.unsupportedMediaTypeError

/**
 * @category constructors
 * @since 1.0.0
 */
export const tooManyRequestsError: (body?: unknown) => HttpError = internal.tooManyRequestsError

/**
 * @category constructors
 * @since 1.0.0
 */
export const internalHttpError: (body?: unknown) => HttpError = internal.internalHttpError

/**
 * @category constructors
 * @since 1.0.0
 */
export const notImplementedError: (body?: unknown) => HttpError = internal.notImplementedError

/**
 * @category constructors
 * @since 1.0.0
 */
export const badGatewayError: (body?: unknown) => HttpError = internal.badGatewayError

/**
 * @category constructors
 * @since 1.0.0
 */
export const serviceUnavailableError: (body?: unknown) => HttpError = internal.serviceUnavailableError

/**
 * @category constructors
 * @since 1.0.0
 */
export const gatewayTimeoutError: (body?: unknown) => HttpError = internal.gatewayTimeoutError
