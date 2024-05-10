/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */
import type * as ParseResult from "@effect/schema/ParseResult"
import type * as Cause from "effect/Cause"

import * as internal from "./internal/client-error.js"

/**
 * @since 1.0.0
 * @category type id
 */
export const ClientSideErrorTypeId: unique symbol = internal.ClientSideErrorTypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type ClientSideErrorTypeId = typeof ClientSideErrorTypeId

/**
 * @since 1.0.0
 * @category type id
 */
export const ServerSideErrorTypeId: unique symbol = internal.ServerSideErrorTypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type ServerSideErrorTypeId = typeof ServerSideErrorTypeId

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
  readonly [ClientSideErrorTypeId]: {}
  readonly _tag: "ClientError"
  readonly message: string
  readonly error: unknown
  readonly side: "client"
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ClientErrorServerSide<S extends number = number> extends Cause.YieldableError {
  readonly [ServerSideErrorTypeId]: {}
  readonly _tag: "ClientError"
  readonly message: string
  readonly error: unknown
  readonly status: S
  readonly side: "server"
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

/**
 * @category refinements
 * @since 1.0.0
 */
export const isClientSideError: (u: unknown) => u is ClientErrorClientSide = internal.isClientSideError

/**
 * @category refinements
 * @since 1.0.0
 */
export const isServerSideError: (u: unknown) => u is ClientErrorServerSide = internal.isServerSideError
