/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */
import type * as ParseResult from "@effect/schema/ParseResult"
import type * as Cause from "effect/Cause"

import * as internal from "./internal/client-error.js"

/**
 * @category models
 * @since 1.0.0
 */
export type ClientError<S extends number = number> =
  | ClientErrorClientSide
  | ClientErrorServerSide<S>

/**
 * @category models
 * @since 1.0.0
 */
export interface ClientErrorClientSide extends Cause.YieldableError {
  _tag: "ClientError"
  message: string
  error: unknown
  side: "client"
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ClientErrorServerSide<S extends number = number> extends Cause.YieldableError {
  _tag: "ClientError"
  message: string
  error: unknown
  status: S
  side: "server"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeClientSide: (error: unknown, message?: string) => ClientErrorClientSide = internal.makeClientSide

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeServerSide: <S extends number>(
  error: unknown,
  status: S,
  message?: string
) => ClientErrorServerSide<S> = internal.makeServerSide

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeClientSideRequestValidation: (
  location: string
) => (error: ParseResult.ParseError) => ClientErrorClientSide = internal.makeClientSideRequestValidation

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeClientSideResponseValidation: (
  location: string
) => (error: ParseResult.ParseError) => ClientErrorClientSide = internal.makeClientSideResponseValidation
