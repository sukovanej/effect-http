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
 * @category type id
 * @since 1.0.0
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @category type id
 * @since 1.0.0
 */
export type TypeId = typeof TypeId

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiRequest<B, P, Q, H, R, C> extends ApiRequest.Variance<B, P, Q, H, R, C> {}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace ApiRequest {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance<B, P, Q, H, R, C> {
    readonly [TypeId]: {
      readonly _B: Types.Invariant<B>
      readonly _P: Types.Invariant<P>
      readonly _Q: Types.Invariant<Q>
      readonly _H: Types.Invariant<H>
      readonly _R: Types.Covariant<R>
      readonly _C: Types.Invariant<C>
    }
  }

  /**
   * Any request with all `Body`, `Path`, `Query` and `Headers` set to `any`.
   *
   * @category models
   * @since 1.0.0
   */
  export type Any = ApiRequest<any, any, any, any, any, any>

  /**
   * Default request.
   *
   * @category models
   * @since 1.0.0
   */
  export type Default = ApiRequest<
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    never,
    ApiSchema.Ignored
  >

  /**
   * @category models
   * @since 1.0.0
   */
  export type Body<Request> = [Request] extends [ApiRequest<infer B, any, any, any, any, any>] ? B
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type ClientBody<Request> = [Request] extends [ApiRequest<any, any, any, any, any, infer C>] ? C : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Path<Request> = [Request] extends [ApiRequest<any, infer P, any, any, any, any>] ? P
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Query<Request> = [Request] extends [ApiRequest<any, any, infer Q, any, any, any>] ? Q
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Headers<Request> = [Request] extends [ApiRequest<any, any, any, infer H, any, any>] ? H
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Context<Request> = [Request] extends [ApiRequest<any, any, any, any, infer R, any>] ? R
    : never
}

/**
 * @category getters
 * @since 1.0.0
 */
export const getBodySchema: <B, P, Q, H, R, C>(
  request: ApiRequest<B, P, Q, H, R, C>
) => Schema.Schema<B, any, R> | ApiSchema.Ignored = internal.getBodySchema

/**
 * @category getters
 * @since 1.0.0
 */
export const getClientBodySchema: <B, P, Q, H, R, C>(
  request: ApiRequest<B, P, Q, H, R, C>
) => Schema.Schema<C, any, R> | ApiSchema.Ignored = internal.getClientBodySchema

/**
 * @category getters
 * @since 1.0.0
 */
export const getPathSchema: <B, P, Q, H, R, C>(
  request: ApiRequest<B, P, Q, H, R, C>
) => Schema.Schema<P, any, R> | ApiSchema.Ignored = internal.getPathSchema

/**
 * @category getters
 * @since 1.0.0
 */
export const getQuerySchema: <B, P, Q, H, R, C>(
  request: ApiRequest<B, P, Q, H, R, C>
) => Schema.Schema<Q, any, R> | ApiSchema.Ignored = internal.getQuerySchema

/**
 * @category getters
 * @since 1.0.0
 */
export const getHeadersSchema: <B, P, Q, H, R, C>(
  request: ApiRequest<B, P, Q, H, R, C>
) => Schema.Schema<H, any, R> | ApiSchema.Ignored = internal.getHeadersSchema

/**
 * @category modifications
 * @since 1.0.0
 */
export const setBody: <B, R2>(
  schema: Schema.Schema<B, any, R2>
) => <_, P, Q, H, R1, __>(
  endpoint: ApiRequest<_, P, Q, H, R1, __>
) => ApiRequest<B, P, Q, H, R1 | R2, B> = internal.setBody

/**
 * @category modifications
 * @since 1.0.0
 */
export const setBodies: <B, C, R2>(schemas: {
  server: Schema.Schema<B, any, R2>
  client: Schema.Schema<C, any, R2>
}) => <_, P, Q, H, R1, __>(
  endpoint: ApiRequest<_, P, Q, H, R1, __>
) => ApiRequest<B, P, Q, H, R1 | R2, C> = internal.setBodies

/**
 * @category modifications
 * @since 1.0.0
 */
export const setPath: <P, R2>(
  schema: Schema.Schema<P, any, R2>
) => <B, _, Q, H, R1, C>(
  endpoint: ApiRequest<B, _, Q, H, R1, C>
) => ApiRequest<B, P, Q, H, R1 | R2, C> = internal.setPath

/**
 * @category modifications
 * @since 1.0.0
 */
export const setQuery: <Q, R2>(
  schema: Schema.Schema<Q, any, R2>
) => <B, P, _, H, R1, C>(
  endpoint: ApiRequest<B, P, _, H, R1, C>
) => ApiRequest<B, P, Q, H, R1 | R2, C> = internal.setQuery

/**
 * @category modifications
 * @since 1.0.0
 */
export const setHeaders: <H, R2>(
  schema: Schema.Schema<H, any, R2>
) => <B, P, Q, _, R1, C>(
  endpoint: ApiRequest<B, P, Q, _, R1, C>
) => ApiRequest<B, P, Q, H, R1 | R2, C> = internal.setHeaders
