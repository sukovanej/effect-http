/**
 * HTTP errors and redirection messages based on https://developer.mozilla.org/en-US/docs/Web/HTTP/Status.
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
export declare namespace HttpError {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance {
    readonly [TypeId]: object
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
 * @category refinements
 * @since 1.0.0
 */
export const isHttpError: (error: unknown) => error is HttpError = internal.isHttpError

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (status: number, body?: unknown, options?: Partial<HttpError.Options>) => HttpError = internal.make

// *********************************************
// *                                           *
// *               4xx responses               *
// *                                           *
// *********************************************

/**
 * [400 Bad Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400)
 *
 * The server cannot or will not process the request due to something that is perceived
 * to be a client error (e.g., malformed request syntax, invalid request message framing,
 * or deceptive request routing).
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const badRequest: HttpError.HttpErrorFn = internal.makeStatus(400)

/**
 * [401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401)
 *
 * Although the HTTP standard specifies "unauthorized", semantically this response means
 * "unauthenticated". That is, the client must authenticate itself to get the requested response.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const unauthorized: HttpError.HttpErrorFn = internal.makeStatus(401)

/**
 * [403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)
 *
 * The client does not have access rights to the content; that is, it is unauthorized, so
 * the server is refusing to give the requested resource. Unlike 401 Unauthorized, the
 * client's identity is known to the server.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const forbidden: HttpError.HttpErrorFn = internal.makeStatus(403)

/**
 * [404 Not Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404)
 *
 * The server cannot find the requested resource. In the browser, this means the URL is
 * not recognized. In an API, this can also mean that the endpoint is valid but the
 * resource itself does not exist. Servers may also send this response instead of 403
 * Forbidden to hide the existence of a resource from an unauthorized client. This
 * response code is probably the most well known due to its frequent occurrence on the web.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const notFound: HttpError.HttpErrorFn = internal.makeStatus(404)

/**
 * [405 Method Not Allowed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405)
 *
 * The request method is known by the server but is not supported by the target resource.
 * For example, an API may not allow calling `DELETE` to remove a resource.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const methodNotAllowed: HttpError.HttpErrorFn = internal.makeStatus(405)

/**
 * [406 Not Acceptable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406)
 *
 * This response is sent when the web server, after performing [server-driven content
 * negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation#server-driven_content_negotiation),
 * doesn't find any content that conforms to the criteria given by the user agent.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const notAcceptable: HttpError.HttpErrorFn = internal.makeStatus(406)

/**
 * [407 Proxy Authentication Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407)
 *
 * This is similar to 401 Unauthorized but authentication is needed to be done by a proxy.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const proxyAuthenticationRequired: HttpError.HttpErrorFn = internal.makeStatus(407)

/**
 * [408 Request Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408)
 *
 * This response is sent on an idle connection by some servers, even without any previous
 * request by the client. It means that the server would like to shut down this unused
 * connection. This response is used much more since some browsers, like Chrome,
 * Firefox 27+, or IE9, use HTTP pre-connection mechanisms to speed up surfing. Also
 * note that some servers merely shut down the connection without sending this message.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const requestTimeout: HttpError.HttpErrorFn = internal.makeStatus(408)

/**
 * [409 Conflict](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409)
 *
 * This response is sent when a request conflicts with the current state of the server.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const conflict: HttpError.HttpErrorFn = internal.makeStatus(409)

/**
 * [410 Gone](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410)
 *
 * This response is sent when the requested content has been permanently deleted from
 * server, with no forwarding address. Clients are expected to remove their caches
 * and links to the resource. The HTTP specification intends this status code to be
 * used for "limited-time, promotional services". APIs should not feel compelled to
 * indicate resources that have been deleted with this status code.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const gone: HttpError.HttpErrorFn = internal.makeStatus(410)

/**
 * [411 Length Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411)
 *
 * Server rejected the request because the Content-Length header field is not defined
 * and the server requires it.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const lengthRequired: HttpError.HttpErrorFn = internal.makeStatus(411)

/**
 * [412 Precondition Failed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412)
 *
 * The client has indicated preconditions in its headers which the server does not meet.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const preconditionFailed: HttpError.HttpErrorFn = internal.makeStatus(412)

/**
 * [413 Payload Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413)
 *
 * Request entity is larger than limits defined by server. The server might close the
 * connection or return an Retry-After header field.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const payloadTooLarge: HttpError.HttpErrorFn = internal.makeStatus(413)

/**
 * [414 URI Too Long](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414)
 *
 * The URI requested by the client is longer than the server is willing to interpret.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const uriTooLong: HttpError.HttpErrorFn = internal.makeStatus(414)

/**
 * [415 Unsupported Media Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415)
 *
 * The media format of the requested data is not supported by the server, so the
 * server is rejecting the request.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const unsupportedMediaType: HttpError.HttpErrorFn = internal.makeStatus(415)

/**
 * [416 Range Not Satisfiable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416)
 *
 * The range specified by the Range header field in the request cannot be fulfilled. It's
 * possible that the range is outside the size of the target URI's data.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const rangeNotSatisfiable: HttpError.HttpErrorFn = internal.makeStatus(416)

/**
 * [417 Expectation Failed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417)
 *
 * This response code means the expectation indicated by the Expect request header field
 * cannot be met by the server.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const expectationFailed: HttpError.HttpErrorFn = internal.makeStatus(417)

/**
 * [418 I'm a teapot](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418)
 *
 * The server refuses the attempt to brew coffee with a teapot.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const imATeapot: HttpError.HttpErrorFn = internal.makeStatus(418)

/**
 * [421 Misdirected Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421)
 *
 * The request was directed at a server that is not able to produce a response. This
 * can be sent by a server that is not configured to produce responses for the
 * combination of scheme and authority that are included in the request URI.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const misdirectedRequest: HttpError.HttpErrorFn = internal.makeStatus(421)

/**
 * [426 Upgrade Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426)
 *
 * The server refuses to perform the request using the current protocol but might be
 * willing to do so after the client upgrades to a different protocol. The server
 * sends an Upgrade header in a 426 response to indicate the required protocol(s).
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const upgradeRequired: HttpError.HttpErrorFn = internal.makeStatus(426)

/**
 * [429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
 *
 * The user has sent too many requests in a given amount of time ("rate limiting").
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const tooManyRequests: HttpError.HttpErrorFn = internal.makeStatus(429)

/**
 * [431 Request Header Fields Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431)
 *
 * The server is unwilling to process the request because its header fields are too large.
 * The request may be resubmitted after reducing the size of the request header fields.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const requestHeaderFieldsTooLarge: HttpError.HttpErrorFn = internal.makeStatus(431)

/**
 * [451 Unavailable For Legal Reasons](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451)
 *
 * The user agent requested a resource that cannot legally be provided, such as a web
 * page censored by a government.
 *
 * @category 4xx constructors
 * @since 1.0.0
 */
export const unavailableForLegalReasons: HttpError.HttpErrorFn = internal.makeStatus(451)

// *********************************************
// *                                           *
// *               5xx responses               *
// *                                           *
// *********************************************

/**
 * [500 Internal Server Error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500)
 *
 * The server has encountered a situation it does not know how to handle.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const internalServerError: HttpError.HttpErrorFn = internal.makeStatus(500)

/**
 * [501 Not Implemented](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501)
 *
 * The request method is not supported by the server and cannot be handled. The only
 * methods that servers are required to support (and therefore that must not return
 * this code) are GET and HEAD.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const notImplemented: HttpError.HttpErrorFn = internal.makeStatus(501)

/**
 * [502 Bad Gateway](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502)
 *
 * This error response means that the server, while working as a gateway to get a
 * response needed to handle the request, got an invalid response.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const badGateway: HttpError.HttpErrorFn = internal.makeStatus(502)

/**
 * [503 Service Unavailable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503)
 *
 * The server is not ready to handle the request. Common causes are a server that
 * is down for maintenance or that is overloaded. Note that together with this response,
 * a user-friendly page explaining the problem should be sent. This response should
 * be used for temporary conditions and the Retry-After HTTP header should, if possible,
 * contain the estimated time before the recovery of the service. The webmaster must
 * also take care about the caching-related headers that are sent along with this
 * response, as these temporary condition responses should usually not be cached.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const serviceUnavailable: HttpError.HttpErrorFn = internal.makeStatus(503)

/**
 * [504 Gateway Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504)
 *
 * This error response is given when the server is acting as a gateway and
 * cannot get a response in time.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const gatewayTimeout: HttpError.HttpErrorFn = internal.makeStatus(504)

/**
 * [505 HTTP Version Not Supported](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505)
 *
 * The HTTP version used in the request is not supported by the server.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const httpVersionNotSupported: HttpError.HttpErrorFn = internal.makeStatus(505)

/**
 * [506 Variant Also Negotiates](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506)
 *
 * The server has an internal configuration error: the chosen variant resource is
 * configured to engage in transparent content negotiation itself, and is
 * therefore not a proper end point in the negotiation process.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const variantAlsoNegotiates: HttpError.HttpErrorFn = internal.makeStatus(506)

/**
 * [510 Not Extended](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510)
 *
 * Further extensions to the request are required for the server to fulfill it.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const notExtended: HttpError.HttpErrorFn = internal.makeStatus(510)

/**
 * [511 Network Authentication Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511)
 *
 * Indicates that the client needs to authenticate to gain network access.
 *
 * @category 5xx constructors
 * @since 1.0.0
 */
export const networkAuthenticationRequired: HttpError.HttpErrorFn = internal.makeStatus(511)

// *********************************************
// *                                           *
// *               3xx responses               *
// *                                           *
// *********************************************

/**
 * [300 Multiple Choices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300)
 *
 * The request has more than one possible response. The user agent or user should choose one of them.
 * (There is no standardized way of choosing one of the responses, but HTML links to the possibilities
 * are recommended so the user can pick.)
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const multipleChoices: HttpError.HttpErrorFn = internal.makeStatus(300)

/**
 * [301 Moved Permanently](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301)
 *
 * The URL of the requested resource has been changed permanently. The new URL is given in the response.
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const movedPermanently: HttpError.HttpErrorFn = internal.makeStatus(301)

/**
 * [302 Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)
 *
 * This response code means that the URI of requested resource has been changed temporarily. Further
 * changes in the URI might be made in the future. Therefore, this same URI should be used by the
 * client in future requests.
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const found: HttpError.HttpErrorFn = internal.makeStatus(302)

/**
 * [303 See Other](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303)
 *
 * The server sent this response to direct the client to get the requested resource at another URI
 * with a GET request.
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const seeOther: HttpError.HttpErrorFn = internal.makeStatus(303)

/**
 * [304 Not Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)
 *
 * This is used for caching purposes. It tells the client that the response has not been modified,
 * so the client can continue to use the same cached version of the response.
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const notModified: HttpError.HttpErrorFn = internal.makeStatus(304)

/**
 * [307 Temporary Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307)
 *
 * The server sends this response to direct the client to get the requested resource at another URI
 * with the same method that was used in the prior request. This has the same semantics as the
 * `302 Found` HTTP response code, with the exception that the user agent must not change the HTTP
 * method * used: if a `POST` was used in the first request, a `POST` must be used in the second request.
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const temporaryRedirect: HttpError.HttpErrorFn = internal.makeStatus(307)

/**
 * [308 Permanent Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308)
 *
 * This means that the resource is now permanently located at another URI, specified by the
 * `Location:` HTTP Response header. This has the same semantics as the 301 Moved Permanently HTTP
 * response code, with the exception that the user agent must not change the HTTP method used:
 * if a POST was used in the first request, a POST must be used in the second request.
 *
 * @category 3xx constructors
 * @since 1.0.0
 */
export const permanentRedirect: HttpError.HttpErrorFn = internal.makeStatus(308)
