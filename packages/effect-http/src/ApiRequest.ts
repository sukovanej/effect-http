/**
 * HTTP request declaration.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import type * as Types from "effect/Types"
import type * as ApiSchema from "./ApiSchema.js"
import * as internal from "./internal/api-request.js"

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
export interface ApiRequest<B, P, Q, H, R> extends ApiRequest.Variance<B, P, Q, H, R> {}

/**
 * @since 1.0.0
 */
export declare namespace ApiRequest {
  /**
   * @since 1.0.0
   */
  export interface Variance<B, P, Q, H, R> {
    readonly [TypeId]: {
      readonly _B: Types.Invariant<B>
      readonly _P: Types.Invariant<P>
      readonly _Q: Types.Invariant<Q>
      readonly _H: Types.Invariant<H>
      readonly _R: Types.Covariant<R>
    }
  }

  /**
   * Any request with all `Body`, `Path`, `Query` and `Headers` set to `any`.
   *
   * @since 1.0.0
   */
  export type Any = ApiRequest<any, any, any, any, any>

  /**
   * Default request.
   *
   * @since 1.0.0
   */
  export type Default = ApiRequest<ApiSchema.Ignored, ApiSchema.Ignored, ApiSchema.Ignored, ApiSchema.Ignored, never>

  /**
   * @since 1.0.0
   */
  export type Body<Request> = [Request] extends [ApiRequest<infer B, any, any, any, any>] ? B
    : never

  /**
   * @since 1.0.0
   */
  export type Path<Request> = [Request] extends [ApiRequest<any, infer P, any, any, any>] ? P
    : never

  /**
   * @since 1.0.0
   */
  export type Query<Request> = [Request] extends [ApiRequest<any, any, infer Q, any, any>] ? Q
    : never

  /**
   * @since 1.0.0
   */
  export type Headers<Request> = [Request] extends [ApiRequest<any, any, any, infer H, any>] ? H
    : never

  /**
   * @since 1.0.0
   */
  export type Requirements<Request> = [Request] extends [ApiRequest<any, any, any, any, infer R>] ? R
    : never
}

/**
 * @category combinators
 * @since 1.0.0
 */
export const getBodySchema: <B, P, Q, H, R>(
  request: ApiRequest<B, P, Q, H, R>
) => Schema.Schema<B, any, R> | ApiSchema.Ignored = internal.getBodySchema

/**
 * @category combinators
 * @since 1.0.0
 */
export const getPathSchema: <B, P, Q, H, R>(
  request: ApiRequest<B, P, Q, H, R>
) => Schema.Schema<P, any, R> | ApiSchema.Ignored = internal.getPathSchema

/**
 * @category combinators
 * @since 1.0.0
 */
export const getQuerySchema: <B, P, Q, H, R>(
  request: ApiRequest<B, P, Q, H, R>
) => Schema.Schema<Q, any, R> | ApiSchema.Ignored = internal.getQuerySchema

/**
 * @category combinators
 * @since 1.0.0
 */
export const getHeadersSchema: <B, P, Q, H, R>(
  request: ApiRequest<B, P, Q, H, R>
) => Schema.Schema<H, any, R> | ApiSchema.Ignored = internal.getHeadersSchema

/**
 * @category combinators
 * @since 1.0.0
 */
export const setBody: <B, R2>(
  schema: Schema.Schema<B, any, R2>
) => <_, P, Q, H, R1>(
  endpoint: ApiRequest<_, P, Q, H, R1>
) => ApiRequest<B, P, Q, H, R1 | R2> = internal.setBody

/**
 * @category combinators
 * @since 1.0.0
 */
export const setPath: <P, R2>(
  schema: Schema.Schema<P, any, R2>
) => <B, _, Q, H, R1>(
  endpoint: ApiRequest<B, _, Q, H, R1>
) => ApiRequest<B, P, Q, H, R1 | R2> = internal.setPath

/**
 * @category combinators
 * @since 1.0.0
 */
export const setQuery: <Q, R2>(
  schema: Schema.Schema<Q, any, R2>
) => <B, P, _, H, R1>(
  endpoint: ApiRequest<B, P, _, H, R1>
) => ApiRequest<B, P, Q, H, R1 | R2> = internal.setQuery

/**
 * @category combinators
 * @since 1.0.0
 */
export const setHeaders: <H, R2>(
  schema: Schema.Schema<H, any, R2>
) => <B, P, Q, _, R1>(
  endpoint: ApiRequest<B, P, Q, _, R1>
) => ApiRequest<B, P, Q, H, R1 | R2> = internal.setHeaders
