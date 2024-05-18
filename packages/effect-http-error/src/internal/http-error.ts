import * as Body from "@effect/platform/Http/Body"
import * as Headers from "@effect/platform/Http/Headers"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import * as Data from "effect/Data"
import { absurd, identity, pipe } from "effect/Function"
import * as Pipeable from "effect/Pipeable"
import * as Predicate from "effect/Predicate"
import * as Stream from "effect/Stream"
import type * as HttpError from "../HttpError.js"

const unsafeIsStream = (u: unknown): u is Stream.Stream<Uint8Array> =>
  typeof u === "object" && u !== null && Stream.StreamTypeId in u

export class HttpErrorImpl extends Data.TaggedError("HttpError")<{
  status: number
  content: Body.Body
}> implements HttpError.HttpError {
  constructor(status: number, content: Body.Body) {
    super({ status, content })
  }

  static unsafeFromUnknown(status: number, body: unknown) {
    let content = undefined

    if (body === undefined) {
      content = Body.empty
    } else if (body instanceof Uint8Array) {
      content = Body.uint8Array(body)
    } else if (typeof body === "string") {
      content = Body.text(body)
    } else if (unsafeIsStream(body)) {
      content = Body.stream(body)
    } else {
      content = Body.unsafeJson(body)
    }

    return new HttpErrorImpl(status, content)
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

export const toResponse = (error: HttpError.HttpError) => {
  const options: ServerResponse.Options.WithContentType = {
    status: error.status,
    contentType: error.content.contentType,
    headers: pipe(
      Headers.empty,
      error.content.contentLength ? Headers.set("Content-Length", error.content.contentLength.toString()) : identity
    )
  }

  if (error.content._tag === "Empty") {
    return ServerResponse.empty(options)
  } else if (error.content._tag === "Uint8Array") {
    return ServerResponse.uint8Array(error.content.body, options)
  } else if (error.content._tag === "Raw") {
    return ServerResponse.raw(error.content.body, options)
  } else if (error.content._tag === "Stream") {
    return ServerResponse.stream(error.content.stream, options)
  } else if (error.content._tag === "FormData") {
    return ServerResponse.formData(error.content.formData, options)
  }

  return absurd<never>(error.content)
}

export const make = (status: number, body?: unknown) => HttpErrorImpl.unsafeFromUnknown(status, body)

export const badRequest = (body?: unknown) => make(400, body)
export const unauthorizedError = (body?: unknown) => make(401, body)
export const forbiddenError = (body?: unknown) => make(403, body)
export const notFoundError = (body?: unknown) => make(404, body)
export const conflictError = (body?: unknown) => make(409, body)
export const unsupportedMediaTypeError = (body?: unknown) => make(415, body)
export const tooManyRequestsError = (body?: unknown) => make(429, body)
export const internalHttpError = (body?: unknown) => make(500, body)
export const notImplementedError = (body?: unknown) => make(501, body)
export const badGatewayError = (body?: unknown) => make(502, body)
export const serviceUnavailableError = (body?: unknown) => make(503, body)
export const gatewayTimeoutError = (body?: unknown) => make(504, body)

export const isHttpError = (error: unknown): error is HttpError.HttpError => Predicate.isTagged(error, "HttpError")
