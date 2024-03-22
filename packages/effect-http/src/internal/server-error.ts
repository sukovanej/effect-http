import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import * as Data from "effect/Data"
import * as Pipeable from "effect/Pipeable"
import * as Predicate from "effect/Predicate"
import type * as ServerError from "../ServerError.js"

export class ServerErrorImpl extends Data.TaggedError("ServerError")<{
  status: number
  text?: string
  json?: unknown
}> implements ServerError.ServerError {
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

export const toServerResponse = (error: ServerError.ServerError) => {
  const options = { status: error.status }

  if (error.json !== undefined) {
    return ServerResponse.unsafeJson(error.json, options)
  } else if (error.text !== undefined) {
    return ServerResponse.text(error.text, options)
  }

  return ServerResponse.empty(options)
}

export const make = (status: number, body?: unknown) => {
  if (body === undefined) {
    return new ServerErrorImpl({ status })
  }

  if (typeof body === "string") {
    return new ServerErrorImpl({ status, text: body })
  }

  return new ServerErrorImpl({ status, json: body })
}

export const makeText = (status: number, text: string) => new ServerErrorImpl({ status, text })

export const makeJson = (status: number, json: unknown) => new ServerErrorImpl({ status, json })

export const isServerError = (error: unknown): error is ServerError.ServerError =>
  Predicate.isTagged(error, "ServerError")

export const badRequest = (body: unknown) => make(401, body)
export const unauthorizedError = (body: unknown) => make(401, body)
export const forbiddenError = (body: unknown) => make(403, body)
export const notFoundError = (body: unknown) => make(404, body)
export const conflictError = (body: unknown) => make(409, body)
export const unsupportedMediaTypeError = (body: unknown) => make(415, body)
export const tooManyRequestsError = (body: unknown) => make(429, body)
export const internalServerError = (body: unknown) => make(500, body)
export const notImplementedError = (body: unknown) => make(501, body)
export const badGatewayError = (body: unknown) => make(502, body)
export const serviceUnavailableError = (body: unknown) => make(503, body)
export const gatewayTimeoutError = (body: unknown) => make(504, body)
