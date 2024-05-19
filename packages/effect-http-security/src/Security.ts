/**
 * Authentication and authorization.
 * @since 1.0.0
 */
import type * as HttpServer from "@effect/platform/HttpServer"
import type * as Schema from "@effect/schema/Schema"
import type * as HttpError from "effect-http-error/HttpError"
import type * as Effect from "effect/Effect"
import type * as Option from "effect/Option"
import type * as Pipeable from "effect/Pipeable"
import type * as Record from "effect/Record"
import type * as Types from "effect/Types"
import * as internal from "./internal/security.js"

/**
 * @since 1.0.0
 * @category type id
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type TypeId = typeof TypeId

/**
 * @category models
 * @since 1.0.0
 */
export interface Security<A, E = never, R = never> extends Security.Variance<A, E, R>, Pipeable.Pipeable {}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace Security {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance<A, E, R> {
    readonly [TypeId]: {
      readonly _A: Types.Covariant<A>
      readonly _E: Types.Covariant<E>
      readonly _R: Types.Covariant<R>
    }
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export type Any = Security<any, any, any>

  /**
   * @category models
   * @since 1.0.0
   */
  export type Context<T extends Any> = [T] extends [Security<any, any, infer R>] ? R
    : never

  /**
   * @category type-level
   * @since 1.0.0
   */
  export type Error<T extends Any> = [T] extends [Security<any, infer E, any>] ? E
    : never

  /**
   * @category type-level
   * @since 1.0.0
   */
  export type Success<T extends Any> = [T] extends [Security<infer A, any, any>] ? A
    : never

  /**
   * @category type-level
   * @since 1.0.0
   */
  export type Handler<A, E, R> = Effect.Effect<
    A,
    E,
    R | HttpServer.request.ServerRequest
  >
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <A, E, R>(
  parser: Security.Handler<A, E, R>,
  openapi?: Record.ReadonlyRecord<
    string,
    unknown
  >
) => Security<
  A,
  Exclude<E, HttpError.HttpError>,
  Exclude<R, HttpServer.request.ServerRequest>
> = internal.make

/**
 * @category getters
 * @since 1.0.0
 */
export const handleRequest: <A, E, R>(
  security: Security<A, E, R>
) => Security.Handler<A, E, R> = internal.handleRequest

/**
 * @category getters
 * @since 1.0.0
 */
export const getOpenApi: <A, E, R>(
  security: Security<A, E, R>
) => Record.ReadonlyRecord<string, unknown> = internal.getOpenApi

/**
 * @category combinators
 * @since 1.0.0
 */
export const mapHandler: {
  <A, B, E1, E2, R1, R2>(
    f: (handler: Security.Handler<A, E1, R1>) => Security.Handler<B, E2, R2>
  ): (security: Security<A, E1, R1>) => Security<B, E2, R2>
  <A, B, E1, E2, R1, R2>(
    security: Security<A, E1, R1>,
    f: (handler: Security.Handler<A, E1, R1>) => Security.Handler<B, E2, R2>
  ): Security<B, E2, R2>
} = internal.mapHandler

/**
 * @category combinators
 * @since 1.0.0
 */
export const and: {
  <A1, A2, E2, R2>(
    that: Security<A2, E2, R2>
  ): <E1, R1>(
    self: Security<A1, E1, R1>
  ) => Security<[A1, A2], E1 | E2, R1 | R2>
  <A1, E1, R1, A2, E2, R2>(
    self: Security<A1, E1, R1>,
    that: Security<A2, E2, R2>
  ): Security<[A1, A2], E1 | E2, R1 | R2>
} = internal.and

/**
 * @category combinators
 * @since 1.0.0
 */
export const or: {
  <A1, A2, E2, R2>(
    that: Security<A2, E2, R2>
  ): <E1, R1>(
    self: Security<A1, E1, R1>
  ) => Security<A1 | A2, E1 | E2, R1 | R2>
  <A1, E1, R1, A2, E2, R2>(
    self: Security<A1, E1, R1>,
    that: Security<A2, E2, R2>
  ): Security<A1 | A2, E1 | E2, R1 | R2>
} = internal.or

/**
 * @category combinators
 * @since 1.0.0
 */
export const map: {
  <A, B>(f: (a: A) => B): <E, R>(self: Security<A, E, R>) => Security<B, E, R>
  <A, B, E, R>(self: Security<A, E, R>, f: (a: A) => B): Security<B, E, R>
} = internal.map

/**
 * @category combinators
 * @since 1.0.0
 */
export const as: {
  <B>(value: B): <A, E, R>(self: Security<A, E, R>) => Security<B, E, R>
  <A, B, E, R>(self: Security<A, E, R>, value: B): Security<B, E, R>
} = internal.as

/**
 * @category combinators
 * @since 1.0.0
 */
export const asSome: <A, E, R>(
  self: Security<A, E, R>
) => Security<Option.Option<A>, E, R> = internal.asSome

/**
 * @category combinators
 * @since 1.0.0
 */
export const mapEffect: {
  <A1, A2, E2, R2>(
    f: (a: A1) => Effect.Effect<A2, E2, R2>
  ): <E1, R1>(
    self: Security<A1, E1, R1>
  ) => Security<
    A2,
    E1 | Exclude<E2, HttpError.HttpError>,
    R1 | Exclude<R2, HttpServer.request.ServerRequest>
  >
  <A1, E1, R1, A2, E2, R2>(
    self: Security<A1, E1, R1>,
    f: (a: A1) => Security<A2, E2, R2>
  ): Security<
    A2,
    E1 | Exclude<E2, HttpError.HttpError>,
    R1 | Exclude<R2, HttpServer.request.ServerRequest>
  >
} = internal.mapEffect

/**
 * @category combinators
 * @since 1.0.0
 */
export const mapSchema: {
  <A, B>(
    schema: Schema.Schema<B, A>
  ): <E, R>(self: Security<A, E, R>) => Security<B, E, R>
  <A, B, E, R>(
    self: Security<A, E, R>,
    schema: Schema.Schema<B, A>
  ): Security<B, E, R>
} = internal.mapSchema

/**
 * @category models
 * @since 1.0.0
 */
export interface BearerOptions {
  name?: string
  description?: string
  bearerFormat?: string
}

/**
 * Creates bearer http security
 *
 * @category constructors
 * @since 1.0.0
 */
export const bearer: (options?: BearerOptions) => Security<string> = internal.bearer

/**
 * @category models
 * @since 1.0.0
 */
export interface BasicOptions {
  name?: string
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface BasicCredentials {
  user: string
  pass: string
}

/**
 * Creates basic http security
 *
 * @category constructors
 * @since 1.0.0
 */
export const basic: (options?: BasicOptions) => Security<BasicCredentials> = internal.basic

/**
 * Creates always allowing security without a security scheme
 *
 * @category constructors
 * @since 1.0.0
 */
export const unit: Security<void> = internal.unit

/**
 * Creates always failing security without a security scheme
 *
 * @category constructors
 * @since 1.0.0
 */
export const never: Security<never> = internal.never

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiKeyOptions {
  key: string
  in: "header" | "query" // TODO: support cookie
  name?: string
  description?: string
}

/**
 * Creates basic http security
 *
 * @category constructors
 * @since 1.0.0
 */
export const apiKey: (options: ApiKeyOptions) => Security<string> = internal.apiKey
