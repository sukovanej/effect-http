/**
 * Build a `Router` satisfying an `Api.Api`.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App"
import type * as Router from "@effect/platform/Http/Router"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import type * as Pipeable from "effect/Pipeable"
import type * as Scope from "effect/Scope"
import type * as Types from "effect/Types"

import type * as HttpError from "effect-http-error/HttpError"
import type * as Security from "effect-http/Security"
import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiRequest from "./ApiRequest.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as Handler from "./Handler.js"
import * as internal from "./internal/router-builder.js"
import type * as SwaggerRouter from "./SwaggerRouter.js"

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
export interface RouterBuilder<A extends ApiEndpoint.ApiEndpoint.Any, E, R>
  extends RouterBuilder.Variance<A, E, R>, Pipeable.Pipeable
{
  readonly remainingEndpoints: ReadonlyArray<A>
  readonly api: Api.Api.Any
  readonly router: Router.Router<E, R>
  readonly options: Options
}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace RouterBuilder {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance<A extends ApiEndpoint.ApiEndpoint.Any, E, R> {
    readonly [TypeId]: {
      readonly _A: Types.Covariant<A>
      readonly _E: Types.Covariant<E>
      readonly _R: Types.Contravariant<R>
    }
  }

  /**
   * Any router builder
   *
   * @category models
   * @since 1.0.0
   */
  export type Any = RouterBuilder<ApiEndpoint.ApiEndpoint.Any, any, any>

  /**
   * @category models
   * @since 1.0.0
   */
  export type MergeApiEndpoints<A, B> = A extends
    ApiEndpoint.ApiEndpoint<infer Id1, ApiRequest.ApiRequest.Any, ApiResponse.ApiResponse.Any, Security.Security.Any> ?
    B extends
      ApiEndpoint.ApiEndpoint<infer Id2, ApiRequest.ApiRequest.Any, ApiResponse.ApiResponse.Any, Security.Security.Any>
      ? Id1 extends Id2 ? A : never :
    never
    : never
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  readonly parseOptions: AST.ParseOptions
  readonly enableDocs: boolean
  readonly docsPath: `/${string}`
}

/**
 * Create a new unimplemeted `RouterBuilder` from an `Api`.
 *
 * @category handling
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any>(
  api: A,
  options?: Partial<Options>
) => RouterBuilder<Api.Api.Endpoints<A>, never, never> = internal.make

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category handling
 * @since 1.0.0
 */
export const handleRaw: <
  A extends ApiEndpoint.ApiEndpoint.Any,
  E2,
  R2,
  Id extends ApiEndpoint.ApiEndpoint.Id<A>
>(id: Id, handler: Router.Route.Handler<E2, R2>) => <R1, E1>(
  builder: RouterBuilder<A, E1, R1>
) => RouterBuilder<
  ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>,
  E1 | E2 | ApiEndpoint.ApiEndpoint.Error<ApiEndpoint.ApiEndpoint.ExtractById<A, Id>>,
  | R1
  | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<A, Id>>
  | Exclude<R2, Router.RouteContext | ServerRequest.ServerRequest | Scope.Scope>
> = internal.handleRaw

/**
 * Handle an endpoint using a handler function.
 *
 * @category constructors
 * @since 1.0.0
 */
export const handle: {
  <R2, E2, A extends ApiEndpoint.ApiEndpoint.Any, Endpoint extends A>(
    handler: Handler.Handler<Endpoint, E2, R2>
  ): <R1, E1>(builder: RouterBuilder<A, E1, R1>) => RouterBuilder<
    Exclude<A, Endpoint>,
    E1 | Exclude<E2, HttpError.HttpError>,
    | Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>
    | ApiEndpoint.ApiEndpoint.Context<Endpoint>
  >

  <A extends ApiEndpoint.ApiEndpoint.Any, E2, R2, Id extends ApiEndpoint.ApiEndpoint.Id<A>>(
    id: Id,
    fn: Handler.Handler.Function<ApiEndpoint.ApiEndpoint.ExtractById<A, Id>, E2, R2>
  ): <R1, E1>(
    builder: RouterBuilder<A, R1, E1>
  ) => RouterBuilder<
    ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>,
    E1 | Exclude<E2, HttpError.HttpError>,
    | Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>
    | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<A, Id>>
  >
} = internal.handle

/**
 * Handle an endpoint using a handler function.
 *
 * @category constructors
 * @since 1.0.0
 */
export const handler: <R, E, A extends Api.Api.Any, Id extends Api.Api.Ids<A>>(
  api: A,
  id: Id,
  fn: Handler.Handler.Function<Api.Api.EndpointById<A, Id>, E, R>
) => Handler.Handler<Api.Api.EndpointById<A, Id>, E, R> = internal.handler

/**
 * Modify the `Router`.
 *
 * @category mapping
 * @since 1.0.0
 */
export const mapRouter: <A extends ApiEndpoint.ApiEndpoint.Any, E1, E2, R1, R2>(
  fn: (router: Router.Router<E1, R1>) => Router.Router<E2, R2>
) => (builder: RouterBuilder<A, E1, R1>) => RouterBuilder<A, E2, R2> = internal.mapRouter

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category destructors
 * @since 1.0.0
 */
export const getRouter: <E, R>(
  builder: RouterBuilder<any, E, R>
) => Router.Router<E, R> = internal.getRouter

/**
 * Create an `App` instance.
 *
 * @category destructors
 * @since 1.0.0
 */
export const build: <E, R>(
  builder: RouterBuilder<never, E, R>
) => App.Default<E, R | SwaggerRouter.SwaggerFiles> = internal.build

/**
 * Create an `App` instance.
 *
 * Warning: this function doesn't enforce all the endpoints are implemented and
 * a running server might not conform the given Api spec.
 *
 * @category destructors
 * @since 1.0.0
 */
export const buildPartial: <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  builder: RouterBuilder<A, E, R>
) => App.Default<E, R | SwaggerRouter.SwaggerFiles> = internal.buildPartial

/**
 * @category combining
 * @since 1.0.0
 */
export const merge: {
  <R1, E1, R2, E2, A1 extends ApiEndpoint.ApiEndpoint.Any, A2 extends ApiEndpoint.ApiEndpoint.Any>(
    builder1: RouterBuilder<A1, E1, R1>,
    builder2: RouterBuilder<A2, E2, R2>
  ): RouterBuilder<RouterBuilder.MergeApiEndpoints<A1, A2>, E1 | E2, R1 | R2>
  <R2, E2, A2 extends ApiEndpoint.ApiEndpoint.Any>(
    builder2: RouterBuilder<A2, E2, R2>
  ): <R1, E1, A1 extends ApiEndpoint.ApiEndpoint.Any>(
    builder1: RouterBuilder<A1, E1, R1>
  ) => RouterBuilder<RouterBuilder.MergeApiEndpoints<A1, A2>, E1 | E2, R1 | R2>
} = internal.merge

/**
 * @category refinements
 * @since 1.0.0
 */
export const isRouterBuilder: (u: unknown) => u is RouterBuilder.Any = internal.isRouterBuilder
