import * as Cookies from "@effect/platform/Cookies"
import * as Headers from "@effect/platform/Headers"
import * as HttpBody from "@effect/platform/HttpBody"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import * as Data from "effect/Data"
import { absurd, identity, pipe } from "effect/Function"
import * as Pipeable from "effect/Pipeable"
import * as Stream from "effect/Stream"

import type * as HttpError from "../HttpError.js"

/** @internal */
export const TypeId: HttpError.TypeId = Symbol.for("effect-http/HttpError/TypeId") as HttpError.TypeId

/** @internal */
export const variance = {}

/** @internal */
const unsafeIsStream = (u: unknown): u is Stream.Stream<Uint8Array> =>
  typeof u === "object" && u !== null && Stream.StreamTypeId in u

/** @internal */
export class HttpErrorImpl extends Data.Error<{
  readonly status: number
  readonly content: HttpBody.HttpBody
  readonly headers: Headers.Headers
  readonly cookies: Cookies.Cookies
}> implements HttpError.HttpError {
  readonly [TypeId] = variance

  static unsafeFromUnknown(status: number, body: unknown, options?: Partial<HttpError.HttpError.Options>) {
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

    return new HttpErrorImpl({
      status,
      content,
      headers: options?.headers ?? Headers.empty,
      cookies: options?.cookies ?? Cookies.empty
    })
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
      error.headers,
      error.content.contentLength ? Headers.set("Content-Length", error.content.contentLength.toString()) : identity
    ),
    cookies: error.cookies
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
export const make = (status: number, body?: unknown, options?: Partial<HttpError.HttpError.Options>) =>
  HttpErrorImpl.unsafeFromUnknown(status, body, options)

export const makeStatus = (status: number) => (body?: unknown, options?: Partial<HttpError.HttpError.Options>) =>
  HttpErrorImpl.unsafeFromUnknown(status, body, options)

/** @internal */
export const isHttpError = (error: unknown): error is HttpError.HttpError =>
  typeof error === "object" && error !== null && TypeId in error
