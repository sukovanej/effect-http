/**
 * Build a `Router` satisfying an `Api.Api`.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App";
import type * as Router from "@effect/platform/Http/Router";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as AST from "@effect/schema/AST";
import type * as Pipeable from "effect/Pipeable";
import type * as Scope from "effect/Scope";

import type * as Api from "./Api.js";
import type * as Route from "./Route.js";
import type * as ServerError from "./ServerError.js";
import type * as SwaggerRouter from "./SwaggerRouter.js";
import * as internal from "./internal/router-builder.js";

/**
 * @category models
 * @since 1.0.0
 */
export interface RouterBuilder<R, E, RemainingEndpoints extends Api.Endpoint>
  extends Pipeable.Pipeable {
  remainingEndpoints: readonly RemainingEndpoints[];
  api: Api.Api;
  router: Router.Router<R, E>;
  options: Options;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  parseOptions: AST.ParseOptions;
}

/**
 * Create a new unimplemeted `RouterBuilder` from an `Api`.
 *
 * @category handling
 * @since 1.0.0
 */
export const make: <Api extends Api.Api>(
  api: Api,
  options?: Partial<Options>,
) => RouterBuilder<never, never, Api["endpoints"][number]> = internal.make;

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category handling
 * @since 1.0.0
 */
export const handleRaw: <
  R2,
  E2,
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  id: Id,
  handler: Router.Route.Handler<R2, E2>,
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>,
) => RouterBuilder<
  Exclude<
    R1 | R2,
    Router.RouteContext | ServerRequest.ServerRequest | Scope.Scope
  >,
  E1 | E2,
  Exclude<RemainingEndpoints, { id: Id }>
> = internal.handleRaw;

/**
 * Handle an endpoint using a handler function.
 *
 * @category constructors
 * @since 1.0.0
 */
export const handle: <
  R2,
  E2,
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  id: Id,
  fn: Route.HandlerFunction<Extract<RemainingEndpoints, { id: Id }>, R2, E2>,
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>,
) => RouterBuilder<
  Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
  E1 | Exclude<E2, ServerError.ServerError>,
  Exclude<RemainingEndpoints, { id: Id }>
> = internal.handle;

/**
 * Modify the `Router`.
 *
 * @category mapping
 * @since 1.0.0
 */
export const mapRouter =
  <R1, R2, E1, E2, RemainingEndpoints extends Api.Endpoint>(
    fn: (router: Router.Router<R1, E1>) => Router.Router<R2, E2>,
  ) =>
  (
    builder: RouterBuilder<R1, E1, RemainingEndpoints>,
  ): RouterBuilder<R2, E2, RemainingEndpoints> => ({
    ...builder,
    router: fn(builder.router),
  });

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category destructors
 * @since 1.0.0
 */
export const getRouter: <R, E>(
  builder: RouterBuilder<R, E, any>,
) => Router.Router<R, E> = internal.getRouter;

/**
 * Create an `App` instance.
 *
 * @category destructors
 * @since 1.0.0
 */
export const build: <R, E>(
  builder: RouterBuilder<R, E, never>,
) => App.Default<R | SwaggerRouter.SwaggerFiles, E> = internal.build;

/**
 * Create an `App` instance.
 *
 * Warning: this function doesn't enforce all the endpoints are implemented and
 * a running server might not conform the given Api spec.
 *
 * @category destructors
 * @since 1.0.0
 */
export const buildPartial: <R, E, RemainingEndpoints extends Api.Endpoint>(
  builder: RouterBuilder<R, E, RemainingEndpoints>,
) => App.Default<R | SwaggerRouter.SwaggerFiles, E> = internal.buildPartial;
