/**
 * HTTP response declaration.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import type * as Pipeable from "effect/Pipeable"
import type * as ReadonlyArray from "effect/ReadonlyArray"
import type * as Types from "effect/Types"
import type * as ApiSchema from "./ApiSchema.js"
import * as internal from "./internal/api-response.js"
import type * as Representation from "./Representation.js"

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
export interface ApiResponse<S extends ApiResponse.AnyStatus, B, H, R>
  extends ApiResponse.Variance<S, B, H, R>, Pipeable.Pipeable
{}

/**
 * @since 1.0.0
 */
export declare namespace ApiResponse {
  /**
   * @since 1.0.0
   */
  export interface Variance<S, B, H, R> {
    readonly [TypeId]: {
      readonly _S: Types.Covariant<S>
      readonly _B: Types.Invariant<B>
      readonly _H: Types.Invariant<H>
      readonly _R: Types.Covariant<R>
    }
  }

  /**
   * @since 1.0.0
   */
  export type AnyStatus = number

  /**
   * Any request with all `Body`, `Path`, `Query` and `Headers` set to `Schema.Schema.Any`.
   *
   * @since 1.0.0
   */
  export type Any = ApiResponse<AnyStatus, any, any, unknown>

  /**
   * Default response.
   *
   * @since 1.0.0
   */
  export type Default = ApiResponse<200, ApiSchema.Ignored, ApiSchema.Ignored, never>

  /**
   * @since 1.0.0
   */
  export type Status<Request> = [Request] extends [ApiResponse<infer S, any, any, any>] ? S
    : never

  /**
   * @since 1.0.0
   */
  export type Body<Request> = [Request] extends [ApiResponse<any, infer B, any, any>] ? B
    : never

  /**
   * @since 1.0.0
   */
  export type Headers<Request> = [Request] extends [ApiResponse<any, any, infer H, any>] ? H
    : never

  /**
   * @since 1.0.0
   */
  export type Requirements<Request> = [Request] extends [ApiResponse<any, any, any, infer R>] ? R
    : never
}

/**
 * @since 1.0.0
 */
export const isApiResponse: (u: unknown) => u is ApiResponse.Any = internal.isApiResponse

/**
 * @since 1.0.0
 */
export const make: <S extends ApiResponse.AnyStatus, B = ApiSchema.Ignored, H = ApiSchema.Ignored, R = never>(
  status: S,
  body?: Schema.Schema<B, any, R> | ApiSchema.Ignored,
  headers?: Schema.Schema<H, any, R> | ApiSchema.Ignored,
  representations?: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
) => ApiResponse<S, B, H, R> = internal.make

/**
 * @since 1.0.0
 */
export const setStatus: <S extends ApiResponse.AnyStatus>(schema: S) => <_ extends ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse<_, B, H, R>
) => ApiResponse<S, B, H, R> = internal.setStatus

/**
 * @since 1.0.0
 */
export const setBody: <B, R2>(schema: Schema.Schema<B, any, R2>) => <S extends ApiResponse.AnyStatus, _, H, R1>(
  response: ApiResponse<S, _, H, R1>
) => ApiResponse<S, B, H, R1 | R2> = internal.setBody

/**
 * @since 1.0.0
 */
export const setHeaders: <H, R2>(schema: Schema.Schema<H, any, R2>) => <S extends ApiResponse.AnyStatus, B, _, R1>(
  response: ApiResponse<S, B, _, R1>
) => ApiResponse<S, B, H, R1 | R2> = internal.setHeaders

/**
 * @since 1.0.0
 */
export const setRepresentations: (
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
) => <S extends ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse<S, B, H, R>
) => ApiResponse<S, B, H, R> = internal.setRepresentations

/**
 * @since 1.0.0
 */
export const getStatus: <S extends ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse<S, B, H, R>
) => S = internal.getStatus

/**
 * @since 1.0.0
 */
export const getBodySchema: <S extends ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse<S, B, H, R>
) => Schema.Schema<B, any, R> | ApiSchema.Ignored = internal.getBodySchema

/**
 * @since 1.0.0
 */
export const getHeadersSchema: <S extends ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse<S, B, H, R>
) => Schema.Schema<H, any, R> | ApiSchema.Ignored = internal.getHeadersSchema

/**
 * @since 1.0.0
 */
export const getRepresentations: <S extends ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse<S, B, H, R>
) => ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation> = internal.getRepresentations
