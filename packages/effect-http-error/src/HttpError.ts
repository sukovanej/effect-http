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
 * @category models
 * @since 1.0.0
 */
export interface HttpError extends Cause.YieldableError, Pipeable.Pipeable {
  readonly _tag: "HttpError"
  readonly status: number
  readonly content: HttpBody.HttpBody
  readonly headers: Headers.Headers
  readonly cookies: Cookies.Cookies
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  headers: Headers.Headers
  cookies: Cookies.Cookies
}

export type HttpErrorFn = (body?: unknown, options?: Partial<Options>) => HttpError

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
export const make: (status: number, body?: unknown, options?: Partial<Options>) => HttpError = internal.make

/**
 * @category refinements
 * @since 1.0.0
 */
export const isHttpError: (error?: unknown, options?: Partial<Options>) => error is HttpError = internal.isHttpError

/**
 * @category constructors
 * @since 1.0.0
 */
export const badRequest: HttpErrorFn = internal.fromStatusMaker(400)

/**
 * @category constructors
 * @since 1.0.0
 */
export const unauthorizedError: HttpErrorFn = internal.fromStatusMaker(401)

/**
 * @category constructors
 * @since 1.0.0
 */
export const forbiddenError: HttpErrorFn = internal.fromStatusMaker(403)

/**
 * @category constructors
 * @since 1.0.0
 */
export const notFoundError: HttpErrorFn = internal.fromStatusMaker(404)

/**
 * @category constructors
 * @since 1.0.0
 */
export const conflictError: HttpErrorFn = internal.fromStatusMaker(409)

/**
 * @category constructors
 * @since 1.0.0
 */
export const unsupportedMediaTypeError: HttpErrorFn = internal.fromStatusMaker(415)
/**
 * @category constructors
 * @since 1.0.0
 */
export const tooManyRequestsError: HttpErrorFn = internal.fromStatusMaker(429)

/**
 * @category constructors
 * @since 1.0.0
 */
export const internalHttpError: HttpErrorFn = internal.fromStatusMaker(500)

/**
 * @category constructors
 * @since 1.0.0
 */
export const notImplementedError: HttpErrorFn = internal.fromStatusMaker(501)

/**
 * @category constructors
 * @since 1.0.0
 */
export const badGatewayError: HttpErrorFn = internal.fromStatusMaker(502)

/**
 * @category constructors
 * @since 1.0.0
 */
export const serviceUnavailableError: HttpErrorFn = internal.fromStatusMaker(503)

/**
 * @category constructors
 * @since 1.0.0
 */
export const gatewayTimeoutError: HttpErrorFn = internal.fromStatusMaker(504)

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
export const multipleChoices: HttpErrorFn = internal.fromStatusMaker(300)

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
export const movedPermanently: HttpErrorFn = internal.fromStatusMaker(301)

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
export const found: HttpErrorFn = internal.fromStatusMaker(302)

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
export const seeOther: HttpErrorFn = internal.fromStatusMaker(303)

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
export const notModified: HttpErrorFn = internal.fromStatusMaker(304)

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
export const temporaryRedirect: HttpErrorFn = internal.fromStatusMaker(307)

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
export const permanentRedirect: HttpErrorFn = internal.fromStatusMaker(308)
