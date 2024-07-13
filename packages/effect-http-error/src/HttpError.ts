/**
 * HTTP errors.
 *
 * @since 1.0.0
 */
import type * as Cookies from "@effect/platform/Cookies"
import type * as Headers from "@effect/platform/Headers"
import type * as HttpBody from "@effect/platform/HttpBody"
import type * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import type * as Cause from "effect/Cause"
import type * as Pipeable from "effect/Pipeable"

import * as internal from "./internal/http-error.js"

/**
 * @since 1.0.0
 * @category type id
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type TypeId = typeof TypeId

/**
 * @category models
 * @since 1.0.0
 */
export interface HttpError extends Cause.YieldableError, Pipeable.Pipeable, HttpError.Variance {
  readonly status: number
  readonly content: HttpBody.HttpBody
  readonly headers: Headers.Headers
  readonly cookies: Cookies.Cookies
}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace HttpError {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance {
    readonly [TypeId]: {}
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export interface Options {
    readonly headers: Headers.Headers
    readonly cookies: Cookies.Cookies
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export type HttpErrorFn = (body?: unknown, options?: Partial<Options>) => HttpError
}

/**
 * @category destructors
 * @since 1.0.0
 */
export const toResponse: (
  error: HttpError
) => HttpServerResponse.HttpServerResponse = internal.toResponse

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (status: number, body?: unknown, options?: Partial<HttpError.Options>) => HttpError = internal.make

/**
 * @category refinements
 * @since 1.0.0
 */
export const isHttpError: (error?: unknown, options?: Partial<HttpError.Options>) => error is HttpError =
  internal.isHttpError

/**
 * @category constructors
 * @since 1.0.0
 */
export const badRequest: HttpError.HttpErrorFn = internal.makeStatus(400)

/**
 * @category constructors
 * @since 1.0.0
 */
export const unauthorizedError: HttpError.HttpErrorFn = internal.makeStatus(401)

/**
 * @category constructors
 * @since 1.0.0
 */
export const forbiddenError: HttpError.HttpErrorFn = internal.makeStatus(403)

/**
 * @category constructors
 * @since 1.0.0
 */
export const notFoundError: HttpError.HttpErrorFn = internal.makeStatus(404)

/**
 * @category constructors
 * @since 1.0.0
 */
export const conflictError: HttpError.HttpErrorFn = internal.makeStatus(409)

/**
 * @category constructors
 * @since 1.0.0
 */
export const unsupportedMediaTypeError: HttpError.HttpErrorFn = internal.makeStatus(415)
/**
 * @category constructors
 * @since 1.0.0
 */
export const tooManyRequestsError: HttpError.HttpErrorFn = internal.makeStatus(429)

/**
 * @category constructors
 * @since 1.0.0
 */
export const internalHttpError: HttpError.HttpErrorFn = internal.makeStatus(500)

/**
 * @category constructors
 * @since 1.0.0
 */
export const notImplementedError: HttpError.HttpErrorFn = internal.makeStatus(501)

/**
 * @category constructors
 * @since 1.0.0
 */
export const badGatewayError: HttpError.HttpErrorFn = internal.makeStatus(502)

/**
 * @category constructors
 * @since 1.0.0
 */
export const serviceUnavailableError: HttpError.HttpErrorFn = internal.makeStatus(503)

/**
 * @category constructors
 * @since 1.0.0
 */
export const gatewayTimeoutError: HttpError.HttpErrorFn = internal.makeStatus(504)

// ************************
// *    3xx responses     *
// ************************

/**
 * 300 Multiple Choices
 *
 * The request has more than one possible response. The user agent or user should choose one of them.
 * (There is no standardized way of choosing one of the responses, but HTML links to the possibilities
 * are recommended so the user can pick.)
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300
 *
 * @category constructors
 * @since 1.0.0
 */
export const multipleChoices: HttpError.HttpErrorFn = internal.makeStatus(300)

/**
 * 301 Moved Permanently
 *
 * The URL of the requested resource has been changed permanently. The new URL is given in the response.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301
 *
 * @category constructors
 * @since 1.0.0
 */
export const movedPermanently: HttpError.HttpErrorFn = internal.makeStatus(301)

/**
 * 302 Found
 *
 * This response code means that the URI of requested resource has been changed temporarily. Further
 * changes in the URI might be made in the future. Therefore, this same URI should be used by the
 * client in future requests.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302
 *
 * @category constructors
 * @since 1.0.0
 */
export const found: HttpError.HttpErrorFn = internal.makeStatus(302)

/**
 * 303 See Other
 *
 * The server sent this response to direct the client to get the requested resource at another URI
 * with a GET request.

 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303
 *
 * @category constructors
 * @since 1.0.0
 */
export const seeOther: HttpError.HttpErrorFn = internal.makeStatus(303)

/**
 * 304 Not Modified
 *
 * This is used for caching purposes. It tells the client that the response has not been modified,
 * so the client can continue to use the same cached version of the response.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304
 *
 * @category constructors
 * @since 1.0.0
 */
export const notModified: HttpError.HttpErrorFn = internal.makeStatus(304)

/**
 * 307 Temporary Redirect
 *
 * The server sends this response to direct the client to get the requested resource at another URI
 * with the same method that was used in the prior request. This has the same semantics as the
 * `302 Found` HTTP response code, with the exception that the user agent must not change the HTTP
 * method * used: if a `POST` was used in the first request, a `POST` must be used in the second request.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
 *
 * @category constructors
 * @since 1.0.0
 */
export const temporaryRedirect: HttpError.HttpErrorFn = internal.makeStatus(307)

/**
 * 308 Permanent Redirect
 *
 * This means that the resource is now permanently located at another URI, specified by the
 * `Location:` HTTP Response header. This has the same semantics as the 301 Moved Permanently HTTP
 * response code, with the exception that the user agent must not change the HTTP method used:
 * if a POST was used in the first request, a POST must be used in the second request.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
 *
 * @category constructors
 * @since 1.0.0
 */
export const permanentRedirect: HttpError.HttpErrorFn = internal.makeStatus(308)
