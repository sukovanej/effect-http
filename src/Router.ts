import * as Router from "@effect/platform/Http/Router";
import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import * as Api from "effect-http/Api";
import * as Route from "effect-http/Route";
import * as ServerError from "effect-http/ServerError";
import { convertMethod } from "effect-http/internal/utils";
import * as Pipeable from "effect/Pipeable";

/**
 * @category models
 * @since 1.0.0
 */
export interface RouterBuilder<
  R,
  E,
  RemainingEndpoints extends Api.Endpoint,
  Api extends Api.Api,
> extends Pipeable.Pipeable {
  remainingEndpoints: readonly RemainingEndpoints[];
  router: Router.Router<R, E>;
  api: Api;
}

/**
 * Create a new unimplemeted `RouterBuilder` from an `Api`.
 *
 * @category handling
 * @since 1.0.0
 */
export const make = <Api extends Api.Api>(
  api: Api,
): RouterBuilder<never, never, Api["endpoints"][number], Api> => ({
  remainingEndpoints: api.endpoints,
  api,
  router: Router.empty,
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments);
  },
});

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category handling
 * @since 1.0.0
 */
export const handleRaw =
  <
    R2,
    E2,
    RemainingEndpoints extends Api.Endpoint,
    A extends Api.Api,
    Id extends RemainingEndpoints["id"],
  >(
    id: Id,
    handler: Router.Route.Handler<R2, E2>,
  ) =>
  <R1, E1>(
    builder: RouterBuilder<R1, E1, RemainingEndpoints, A>,
  ): RouterBuilder<
    Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
    E1 | E2,
    Exclude<RemainingEndpoints, { id: Id }>,
    A
  > => {
    const endpoint = getRemainingEndpoint(builder, id);
    const remainingEndpoints = removeRemainingEndpoint(builder, id);

    const router = builder.router.pipe(
      Router.route(convertMethod(endpoint.method))(endpoint.path, handler),
    );

    return {
      ...builder,
      router,
      remainingEndpoints,
    };
  };

/**
 * Handle an endpoint using a handler function.
 *
 * @category constructors
 * @since 1.0.0
 */
export const handle =
  <
    R2,
    E2,
    RemainingEndpoints extends Api.Endpoint,
    A extends Api.Api,
    Id extends RemainingEndpoints["id"],
  >(
    id: Id,
    fn: Route.HandlerFunction<Extract<RemainingEndpoints, { id: Id }>, R2, E2>,
  ) =>
  <R1, E1>(
    builder: RouterBuilder<R1, E1, RemainingEndpoints, A>,
  ): RouterBuilder<
    Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
    E1 | Exclude<E2, ServerError.ApiError>,
    Exclude<RemainingEndpoints, { id: Id }>,
    A
  > => {
    const endpoint = getRemainingEndpoint(builder, id);
    const remainingEndpoints = removeRemainingEndpoint(builder, id);

    const router = Route.addRoute(
      builder.router,
      Route.fromEndpoint(fn)(endpoint),
    );

    return {
      ...builder,
      router,
      remainingEndpoints,
    };
  };

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category mapping
 * @since 1.0.0
 */
export const mapRouter =
  <
    R1,
    R2,
    E1,
    E2,
    RemainingEndpoints extends Api.Endpoint,
    Api extends Api.Api,
  >(
    fn: (router: Router.Router<R1, E1>) => Router.Router<R2, E2>,
  ) =>
  (
    builder: RouterBuilder<R1, E1, RemainingEndpoints, Api>,
  ): RouterBuilder<R1 | R2, E1 | E2, RemainingEndpoints, Api> => ({
    ...builder,
    router: fn(builder.router),
  });

/**
 * Handle an endpoint using a raw `Router.Route.Handler`.
 *
 * @category getters
 * @since 1.0.0
 */
export const getRouter = <R, E>(
  builder: RouterBuilder<R, E, any, any>,
): Router.Router<R, E> => builder.router;

/** @internal */
const getRemainingEndpoint = <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  builder: RouterBuilder<any, any, RemainingEndpoints, any>,
  id: Id,
): Extract<RemainingEndpoints, { id: Id }> => {
  const endpoint = builder.remainingEndpoints.find(
    (endpoint) => endpoint.id === id,
  ) as Extract<RemainingEndpoints, { id: Id }> | undefined;

  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`);
  }

  return endpoint;
};

/** @internal */
const removeRemainingEndpoint = <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  builder: RouterBuilder<any, any, RemainingEndpoints, any>,
  id: Id,
): Exclude<RemainingEndpoints, { id: Id }>[] =>
  builder.remainingEndpoints.filter(
    (endpoint) => endpoint.id !== id,
  ) as Exclude<RemainingEndpoints, { id: Id }>[];
