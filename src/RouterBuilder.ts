/**
 * Build a `Router` satisfying an `Api.Api`.
 *
 * @since 1.0.0
 */
import * as App from "@effect/platform/Http/App";
import * as Router from "@effect/platform/Http/Router";
import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import * as Api from "effect-http/Api";
import * as OpenApi from "effect-http/OpenApi";
import * as Route from "effect-http/Route";
import * as ServerError from "effect-http/ServerError";
import * as SwaggerRouter from "effect-http/SwaggerRouter";
import { convertMethod } from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import * as Pipeable from "effect/Pipeable";

/**
 * @category models
 * @since 1.0.0
 */
export interface RouterBuilder<R, E, RemainingEndpoints extends Api.Endpoint>
  extends Pipeable.Pipeable {
  remainingEndpoints: readonly RemainingEndpoints[];
  api: Api.Api;
  router: Router.Router<R, E>;
}

/**
 * Create a new unimplemeted `RouterBuilder` from an `Api`.
 *
 * @category handling
 * @since 1.0.0
 */
export const make = <Api extends Api.Api>(
  api: Api,
): RouterBuilder<never, never, Api["endpoints"][number]> => ({
  remainingEndpoints: api.endpoints,
  router: Router.empty,
  api,
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
    Id extends RemainingEndpoints["id"],
  >(
    id: Id,
    handler: Router.Route.Handler<R2, E2>,
  ) =>
  <R1, E1>(
    builder: RouterBuilder<R1, E1, RemainingEndpoints>,
  ): RouterBuilder<
    Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
    E1 | E2,
    Exclude<RemainingEndpoints, { id: Id }>
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
    Id extends RemainingEndpoints["id"],
  >(
    id: Id,
    fn: Route.HandlerFunction<Extract<RemainingEndpoints, { id: Id }>, R2, E2>,
  ) =>
  <R1, E1>(
    builder: RouterBuilder<R1, E1, RemainingEndpoints>,
  ): RouterBuilder<
    Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
    E1 | Exclude<E2, ServerError.ServerError>,
    Exclude<RemainingEndpoints, { id: Id }>
  > => {
    const endpoint = getRemainingEndpoint(builder, id);
    const remainingEndpoints = removeRemainingEndpoint(builder, id);

    const router = addRoute(builder.router, Route.fromEndpoint(fn)(endpoint));

    return {
      ...builder,
      router,
      remainingEndpoints,
    };
  };

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
export const getRouter = <R, E>(
  builder: RouterBuilder<R, E, any>,
): Router.Router<R, E> => builder.router;

/**
 * Create an `App` instance.
 *
 * @category destructors
 * @since 1.0.0
 */
export const build = <R, E>(
  builder: RouterBuilder<R, E, never>,
): App.Default<R | SwaggerRouter.SwaggerFiles, E> => buildPartial(builder);

/**
 * Create an `App` instance.
 *
 * Warning: this function doesn't enforce all the endpoints are implemented and
 * a running server might not conform the given Api spec.
 *
 * @category destructors
 * @since 1.0.0
 */
export const buildPartial = <R, E, RemainingEndpoints extends Api.Endpoint>(
  builder: RouterBuilder<R, E, RemainingEndpoints>,
): App.Default<R | SwaggerRouter.SwaggerFiles, E> => {
  const swaggerRouter = SwaggerRouter.make(OpenApi.openApi(builder.api));
  return Router.concat(builder.router, swaggerRouter).pipe(
    Effect.catchTag("RouteNotFound", () =>
      ServerResponse.text("Not Found", { status: 404 }),
    ),
  );
};

/** @internal */
const getRemainingEndpoint = <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  builder: RouterBuilder<any, any, RemainingEndpoints>,
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
  builder: RouterBuilder<any, any, RemainingEndpoints>,
  id: Id,
): Exclude<RemainingEndpoints, { id: Id }>[] =>
  builder.remainingEndpoints.filter(
    (endpoint) => endpoint.id !== id,
  ) as Exclude<RemainingEndpoints, { id: Id }>[];

/** @internal */
export const addRoute = <R1, R2, E1, E2>(
  router: Router.Router<R1, E1>,
  route: Router.Route<R2, E2>,
): Router.Router<
  Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
  E1 | E2
> => Router.concat(Router.fromIterable([route]))(router) as any;
