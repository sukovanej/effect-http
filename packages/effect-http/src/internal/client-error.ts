import type * as ParseResult from "@effect/schema/ParseResult"
import * as Data from "effect/Data"
import type * as ClientError from "../ClientError.js"
import { formatParseError } from "./formatParseError.js"

export class ClientErrorServerSideImpl<S extends number> extends Data.TaggedError("ClientError")<{
  message: string
  error: unknown
  status: S
  side: "server"
}> implements ClientError.ClientErrorServerSide {}

export class ClientErrorClientSideImpl extends Data.TaggedError("ClientError")<{
  message: string
  error: unknown
  side: "client"
}> implements ClientError.ClientErrorClientSide {}

export const makeClientSide = (error: unknown, message?: string) => {
  return new ClientErrorClientSideImpl({
    message: message ?? (typeof error === "string" ? error : JSON.stringify(error)),
    error,
    side: "client"
  })
}

export const makeServerSide = <S extends number>(
  error: unknown,
  status: S,
  message?: string
) => {
  return new ClientErrorServerSideImpl<S>({
    message: message ?? (typeof error === "string" ? error : JSON.stringify(error)),
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
