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

import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import * as internal from "./internal/router-builder.js"
import type * as Route from "./Route.js"
import type * as ServerError from "./ServerError.js"
import type * as SwaggerRouter from "./SwaggerRouter.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface RouterBuilder<R, E, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any> extends Pipeable.Pipeable {
  readonly remainingEndpoints: ReadonlyArray<RemainingEndpoints>
  readonly api: Api.Api.Any
  readonly router: Router.Router<E, R>
  readonly options: Options
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
) => RouterBuilder<never, never, Api.Api.Endpoints<A>> = internal.make

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category handling
 * @since 1.0.0
 */
export const handleRaw: <
  R2,
  E2,
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  id: Id,
  handler: Router.Route.Handler<E2, R2>
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
) => RouterBuilder<
  | R1
  | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>
  | Exclude<R2, Router.RouteContext | ServerRequest.ServerRequest | Scope.Scope>,
  E1 | E2 | ApiEndpoint.ApiEndpoint.Error<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> = internal.handleRaw

/**
 * Handle an endpoint using a handler function.
 *
 * @category constructors
 * @since 1.0.0
 */
export const handle: <
  R2,
  E2,
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  id: Id,
  fn: Route.HandlerFunction<
    ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>,
    R2,
    E2
  >
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
) => RouterBuilder<
  | Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>
  | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>,
  E1 | Exclude<E2, ServerError.ServerError>,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> = internal.handle

/**
 * Modify the `Router`.
 *
 * @category mapping
 * @since 1.0.0
 */
export const mapRouter = <R1, R2, E1, E2, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  fn: (router: Router.Router<E1, R1>) => Router.Router<E2, R2>
) =>
(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
): RouterBuilder<R2, E2, RemainingEndpoints> => ({
  ...builder,
  router: fn(builder.router)
})

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category destructors
 * @since 1.0.0
 */
export const getRouter: <R, E>(
  builder: RouterBuilder<R, E, any>
) => Router.Router<E, R> = internal.getRouter

/**
 * Create an `App` instance.
 *
 * @category destructors
 * @since 1.0.0
 */
export const build: <R, E>(
  builder: RouterBuilder<R, E, never>
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
export const buildPartial: <R, E, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  builder: RouterBuilder<R, E, RemainingEndpoints>
) => App.Default<E, R | SwaggerRouter.SwaggerFiles> = internal.buildPartial
