/**
 * Server side handler implementation of an endpoint.
 *
 * @since 1.0.0
 */
import type * as HttpRouter from "@effect/platform/HttpRouter"
import type * as AST from "@effect/schema/AST"
import type * as Effect from "effect/Effect"
import type * as Pipeable from "effect/Pipeable"
import type * as Types from "effect/Types"

import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiRequest from "./ApiRequest.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as HttpError from "./HttpError.js"
import * as internal from "./internal/handler.js"
import type * as utils from "./internal/utils.js"
import type * as Security from "./Security.js"

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
export interface Handler<A extends ApiEndpoint.ApiEndpoint.Any, E = never, R = never>
  extends Handler.Variance<A, E, R>, Pipeable.Pipeable
{}

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  readonly parseOptions: AST.ParseOptions
}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace Handler {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance<A extends ApiEndpoint.ApiEndpoint.Any, E, R> {
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
  export interface Function<A extends ApiEndpoint.ApiEndpoint.Any, E, R> {
    (
      request: ToRequest<ApiEndpoint.ApiEndpoint.Request<A>>,
      security: ToSecurity<ApiEndpoint.ApiEndpoint.Security<A>>
    ): Effect.Effect<ToResponse<ApiEndpoint.ApiEndpoint.Response<A>>, E, R>
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export type Any = Handler<ApiEndpoint.ApiEndpoint.Any, any, any>

  /**
   * @category models
   * @since 1.0.0
   */
  export type Unknown = Handler<ApiEndpoint.ApiEndpoint.Unknown, unknown, unknown>

  /**
   * @category models
   * @since 1.0.0
   */
  export type Endpoint<H extends Handler.Any> = [H] extends [Handler<infer A, any, any>] ? A : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Error<H extends Handler.Any> = [H] extends [Handler<any, infer E, any>] ? E : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Context<H extends Handler.Any> = [H] extends [Handler<any, any, infer C>] ? C : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type ToResponse<
    R extends ApiResponse.ApiResponse.Any
  > = _ToResponse<utils.FilterNon200Responses<R>>

  /** @ignore */
  export type _ToResponse<
    R extends ApiResponse.ApiResponse.Any
  > = utils.IsUnion<R> extends true ? R extends any ? ToFullResponse<R> : never
    : utils.NeedsFullResponse<R> extends true ? ToFullResponse<R>
    : utils.IgnoredToVoid<ApiResponse.ApiResponse.Body<R>>

  /** @ignore */
  export type ToFullResponse<R extends ApiResponse.ApiResponse.Any> = R extends any ?
    `${ApiResponse.ApiResponse.Status<R>}` extends `${1 | 2}${string}` ? Types.Simplify<
        utils.RemoveIgnoredFields<
          {
            readonly status: ApiResponse.ApiResponse.Status<R>
            readonly body: ApiResponse.ApiResponse.Body<R>
            readonly headers: ApiResponse.ApiResponse.Headers<R>
          }
        >
      >
    : never
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type ToRequest<R extends ApiRequest.ApiRequest.Any> = utils.RemoveIgnoredFields<{
    readonly body: ApiRequest.ApiRequest.Body<R>
    readonly path: ApiRequest.ApiRequest.Path<R>
    readonly query: ApiRequest.ApiRequest.Query<R>
    readonly headers: ApiRequest.ApiRequest.Headers<R>
  }>

  /**
   * @category models
   * @since 1.0.0
   */
  export type ToSecurity<Security extends Security.Security.Any> = Security.Security.Success<Security>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: {
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    fn: Handler.Function<A, E, R>,
    options?: Partial<Options>
  ): (endpoint: A) => Handler<A, Exclude<E, HttpError.HttpError>, R>
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    endpoint: A,
    fn: Handler.Function<A, E, R>,
    options?: Partial<Options>
  ): Handler<A, Exclude<E, HttpError.HttpError>, R>
} = internal.make

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeRaw: {
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    handler: HttpRouter.Route.Handler<E, R>
  ): (endpoint: A) => Handler<A, E, R>
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    endpoint: A,
    handler: HttpRouter.Route.Handler<E, R>
  ): Handler<A, E, R>
} = internal.makeRaw

/**
 * @category getters
 * @since 1.0.0
 */
export const getRoute: <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler<A, E, R>
) => HttpRouter.Route<E, R> = internal.getRoute

/**
 * @category getters
 * @since 1.0.0
 */
export const getEndpoint: <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler<A, E, R>
) => A = internal.getEndpoint

/**
 * @category refinements
 * @since 1.0.0
 */
export const isHandler: (
  u: unknown
) => u is Handler<ApiEndpoint.ApiEndpoint.Unknown, unknown, unknown> = internal.isHandler
