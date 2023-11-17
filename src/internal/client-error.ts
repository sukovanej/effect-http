import type * as ParseResult from "@effect/schema/ParseResult";
import type * as ClientError from "effect-http/ClientError";
import { formatParseError } from "effect-http/internal/formatParseError";
import * as Data from "effect/Data";

export class ClientErrorImpl
  extends Data.TaggedError("ClientError")<{
    message: string;
    error: unknown;
    status?: number;
    side: "client" | "server";
  }>
  implements ClientError.ClientError {}

export const makeClientSide = (error: unknown, message?: string) => {
  return new ClientErrorImpl({
    message:
      message ?? (typeof error === "string" ? error : JSON.stringify(error)),
    error,
    side: "client",
  });
};

export const makeServerSide = (
  error: unknown,
  status: number,
  message?: string,
) => {
  return new ClientErrorImpl({
    message:
      message ?? (typeof error === "string" ? error : JSON.stringify(error)),
    error,
    status,
    side: "client",
  });
};

export const makeClientSideRequestValidation =
  (location: string) => (error: ParseResult.ParseError) =>
    new ClientErrorImpl({
      message: `Failed to encode ${location}. ${formatParseError(error)}`,
      error,
      side: "client",
    });

export const makeClientSideResponseValidation =
  (location: string) => (error: ParseResult.ParseError) =>
    new ClientErrorImpl({
      message: `Failed to validate response ${location}. ${formatParseError(
        error,
      )}`,
      error,
      side: "client",
    });
