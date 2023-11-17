/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */
import type * as ParseResult from "@effect/schema/ParseResult";
import * as internal from "effect-http/internal/client-error";
import type * as Data from "effect/Data";

/**
 * @category models
 * @since 1.0.0
 */
export interface ClientError extends Data.YieldableError {
  _tag: "ClientError";
  message: string;
  error: unknown;
  status?: number;
  side: "client" | "server";
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeClientSide: (error: unknown, messge?: string) => ClientError =
  internal.makeClientSide;

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeServerSide: (
  error: unknown,
  status: number,
  messge?: string,
) => ClientError = internal.makeServerSide;

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeClientSideRequestValidation: (
  location: string,
) => (error: ParseResult.ParseError) => ClientError =
  internal.makeClientSideRequestValidation;

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeClientSideResponseValidation: (
  location: string,
) => (error: ParseResult.ParseError) => ClientError =
  internal.makeClientSideResponseValidation;
