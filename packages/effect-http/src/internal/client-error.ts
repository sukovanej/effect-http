import type * as ParseResult from "@effect/schema/ParseResult"
import * as Data from "effect/Data"
import * as Predicate from "effect/Predicate"
import type * as ClientError from "../ClientError.js"
import { formatParseError } from "./formatParseError.js"

export const ClientSideErrorTypeId: ClientError.ClientSideErrorTypeId = Symbol.for(
  "effect-http/ClientError/ClientSideErrorTypeId"
) as ClientError.ClientSideErrorTypeId

export const ServerSideErrorTypeId: ClientError.ServerSideErrorTypeId = Symbol.for(
  "effect-http/ClientError/ServerSideErrorTypeId"
) as ClientError.ServerSideErrorTypeId

export class ClientErrorServerSideImpl<S extends number> extends Data.TaggedError("ClientError")<{
  message: string
  error: unknown
  status: S
  side: "server"
}> implements ClientError.ClientErrorServerSide {
  readonly [ServerSideErrorTypeId] = {}
}

export class ClientErrorClientSideImpl extends Data.TaggedError("ClientError")<{
  message: string
  error: unknown
  side: "client"
}> implements ClientError.ClientErrorClientSide {
  readonly [ClientSideErrorTypeId] = {}
}

export const makeClientSide = (error: unknown, message?: string) => {
  return new ClientErrorClientSideImpl({
    message: message ?? (typeof error === "string" ? error : JSON.stringify(error)),
    error,
    side: "client"
  })
}

const getMessage = (error: unknown) => {
  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message
  }

  return JSON.stringify(error)
}

export const makeServerSide = <S extends number>(
  error: unknown,
  status: S,
  message?: string
) => {
  return new ClientErrorServerSideImpl<S>({
    message: message ?? getMessage(error),
    error,
    status,
    side: "server"
  })
}

export const makeClientSideRequestValidation = (location: string) => (error: ParseResult.ParseError) =>
  new ClientErrorClientSideImpl({
    message: `Failed to encode ${location}. ${formatParseError(error)}`,
    error,
    side: "client"
  })

export const makeClientSideResponseValidation = (location: string) => (error: ParseResult.ParseError) =>
  new ClientErrorClientSideImpl({
    message: `Failed to validate response ${location}. ${
      formatParseError(
        error
      )
    }`,
    error,
    side: "client"
  })

export const isClientSideError = (u: unknown): u is ClientError.ClientErrorClientSide =>
  Predicate.isTagged(u, "ClientError") && ClientSideErrorTypeId in u

export const isServerSideError = (u: unknown): u is ClientError.ClientErrorServerSide =>
  Predicate.isTagged(u, "ClientError") && ServerSideErrorTypeId in u
