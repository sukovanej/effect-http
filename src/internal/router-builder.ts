import type * as App from "@effect/platform/Http/App";
import * as Router from "@effect/platform/Http/Router";
import type * as ServerRequest from "@effect/platform/Http/ServerRequest";
import type * as Api from "effect-http/Api";
import * as OpenApi from "effect-http/OpenApi";
import * as Route from "effect-http/Route";
import type * as RouterBuilder from "effect-http/RouterBuilder";
import * as ServerError from "effect-http/ServerError";
import * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as utils from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import * as Pipeable from "effect/Pipeable";

const DEFAULT_OPTIONS: RouterBuilder.Options = {
  parseOptions: { errors: "first", onExcessProperty: "ignore" },
};

export const make = <A extends Api.Api>(
  api: A,
  options?: Partial<RouterBuilder.Options>,
): RouterBuilder.RouterBuilder<never, never, A["endpoints"][number]> => ({
  remainingEndpoints: api.endpoints,
  router: Router.empty,
  api,
  options: { ...DEFAULT_OPTIONS, ...options },
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments);
  },
});

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
    builder: RouterBuilder.RouterBuilder<R1, E1, RemainingEndpoints>,
  ): RouterBuilder.RouterBuilder<
    Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
    E1 | E2,
    Exclude<RemainingEndpoints, { id: Id }>
  > => {
    const endpoint = getRemainingEndpoint(builder, id);
    const remainingEndpoints = removeRemainingEndpoint(builder, id);

    const router = builder.router.pipe(
      Router.route(utils.convertMethod(endpoint.method))(
        endpoint.path,
        handler,
      ),
    );

    return {
      ...builder,
      router,
      remainingEndpoints,
    };
  };

/** @internal */
const getRemainingEndpoint = <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  builder: RouterBuilder.RouterBuilder<any, any, RemainingEndpoints>,
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
    builder: RouterBuilder.RouterBuilder<R1, E1, RemainingEndpoints>,
  ): RouterBuilder.RouterBuilder<
    Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
    E1 | Exclude<E2, ServerError.ServerError>,
    Exclude<RemainingEndpoints, { id: Id }>
  > => {
    const endpoint = getRemainingEndpoint(builder, id);
    const remainingEndpoints = removeRemainingEndpoint(builder, id);

    const router = addRoute(
      builder.router,
      Route.fromEndpoint(fn, builder.options)(endpoint),
    );

    return {
      ...builder,
      router,
      remainingEndpoints,
    };
  };

export const build = <R, E>(
  builder: RouterBuilder.RouterBuilder<R, E, never>,
): App.Default<R | SwaggerRouter.SwaggerFiles, E> => buildPartial(builder);

export const buildPartial = <R, E, RemainingEndpoints extends Api.Endpoint>(
  builder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>,
): App.Default<R | SwaggerRouter.SwaggerFiles, E> => {
  const swaggerRouter = SwaggerRouter.make(OpenApi.make(builder.api));
  return Router.concat(builder.router, swaggerRouter).pipe(
    Effect.catchTag("RouteNotFound", () =>
      ServerError.make(404, "Not Found").toServerResponse(),
    ),
  );
};

export const getRouter = <R, E>(
  builder: RouterBuilder.RouterBuilder<R, E, any>,
): Router.Router<R, E> => builder.router;

/** @internal */
const removeRemainingEndpoint = <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  builder: RouterBuilder.RouterBuilder<any, any, RemainingEndpoints>,
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
