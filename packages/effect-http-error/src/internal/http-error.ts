import * as Headers from "@effect/platform/Headers"
import * as HttpBody from "@effect/platform/HttpBody"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import * as Data from "effect/Data"
import { absurd, identity, pipe } from "effect/Function"
import * as Pipeable from "effect/Pipeable"
import * as Predicate from "effect/Predicate"
import * as Stream from "effect/Stream"

import type * as HttpError from "../HttpError.js"

/** @internal */
const unsafeIsStream = (u: unknown): u is Stream.Stream<Uint8Array> =>
  typeof u === "object" && u !== null && Stream.StreamTypeId in u

/** @internal */
export class HttpErrorImpl extends Data.TaggedError("HttpError")<{
  status: number
  content: HttpBody.HttpBody
}> implements HttpError.HttpError {
  constructor(status: number, content: HttpBody.HttpBody) {
    super({ status, content })
  }

  static unsafeFromUnknown(status: number, body: unknown) {
    let content = undefined

    if (body === undefined) {
      content = HttpBody.empty
    } else if (body instanceof Uint8Array) {
      content = HttpBody.uint8Array(body)
    } else if (typeof body === "string") {
      content = HttpBody.text(body)
    } else if (unsafeIsStream(body)) {
      content = HttpBody.stream(body)
    } else {
      content = HttpBody.unsafeJson(body)
    }

    return new HttpErrorImpl(status, content)
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const toResponse = (error: HttpError.HttpError) => {
  const options: HttpServerResponse.Options.WithContentType = {
    status: error.status,
    contentType: error.content.contentType,
    headers: pipe(
      Headers.empty,
      error.content.contentLength ? Headers.set("Content-Length", error.content.contentLength.toString()) : identity
    )
  }

  const content = error.content

  if (content._tag === "Empty") {
    return HttpServerResponse.empty(options)
  } else if (content._tag === "Uint8Array") {
    return HttpServerResponse.uint8Array(content.body, options)
  } else if (content._tag === "Raw") {
    return HttpServerResponse.raw(content.body, options)
  } else if (content._tag === "Stream") {
    return HttpServerResponse.stream(content.stream, options)
  } else if (content._tag === "FormData") {
    return HttpServerResponse.formData(content.formData, options)
  }

  return absurd<never>(content)
}

/** @internal */
export const make = (status: number, body?: unknown) => HttpErrorImpl.unsafeFromUnknown(status, body)

/** @internal */
export const badRequest = (body?: unknown) => make(400, body)

/** @internal */
export const unauthorizedError = (body?: unknown) => make(401, body)

/** @internal */
export const forbiddenError = (body?: unknown) => make(403, body)

/** @internal */
export const notFoundError = (body?: unknown) => make(404, body)

/** @internal */
export const conflictError = (body?: unknown) => make(409, body)

/** @internal */
export const unsupportedMediaTypeError = (body?: unknown) => make(415, body)

/** @internal */
export const tooManyRequestsError = (body?: unknown) => make(429, body)

/** @internal */
export const internalHttpError = (body?: unknown) => make(500, body)

/** @internal */
export const notImplementedError = (body?: unknown) => make(501, body)

/** @internal */
export const badGatewayError = (body?: unknown) => make(502, body)

/** @internal */
export const serviceUnavailableError = (body?: unknown) => make(503, body)

/** @internal */
export const gatewayTimeoutError = (body?: unknown) => make(504, body)

/** @internal */
export const isHttpError = (error: unknown): error is HttpError.HttpError => Predicate.isTagged(error, "HttpError")
