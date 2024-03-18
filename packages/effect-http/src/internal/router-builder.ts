import type * as App from "@effect/platform/Http/App"
import * as Router from "@effect/platform/Http/Router"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as Effect from "effect/Effect"
import * as Pipeable from "effect/Pipeable"
import type * as Scope from "effect/Scope"
import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as OpenApi from "../OpenApi.js"
import * as Route from "../Route.js"
import type * as RouterBuilder from "../RouterBuilder.js"
import * as ServerError from "../ServerError.js"
import * as SwaggerRouter from "../SwaggerRouter.js"

const DEFAULT_OPTIONS: RouterBuilder.Options = {
  parseOptions: { errors: "first", onExcessProperty: "ignore" },
  enableDocs: true,
  docsPath: "/docs"
}

export const make = <A extends Api.Api.Any>(
  api: A,
  options?: Partial<RouterBuilder.Options>
): RouterBuilder.RouterBuilder<never, never, Api.Api.Endpoints<A>> => ({
  remainingEndpoints: api.groups.flatMap((group) => group.endpoints) as any,
  router: Router.empty,
  api,
  options: { ...DEFAULT_OPTIONS, ...options },
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
})

export const handleRaw = <
  R2,
  E2,
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  id: Id,
  handler: Router.Route.Handler<R2, E2>
) =>
<R1, E1>(
  builder: RouterBuilder.RouterBuilder<R1, E1, RemainingEndpoints>
): RouterBuilder.RouterBuilder<
  R1 | Exclude<R2, Router.RouteContext | ServerRequest.ServerRequest | Scope.Scope>,
  E1 | E2,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> => {
  const endpoint = getRemainingEndpoint(builder, id)
  const remainingEndpoints = removeRemainingEndpoint(builder, id)

  const router = builder.router.pipe(
    Router.route(ApiEndpoint.getMethod(endpoint))(
      ApiEndpoint.getPath(endpoint),
      handler
    )
  )

  return {
    ...builder,
    router,
    remainingEndpoints
  }
}

/** @internal */
const getRemainingEndpoint = <
  R,
  E,
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  builder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>,
  id: Id
): ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id> => {
  const endpoint = builder.remainingEndpoints.find(
    (endpoint) => ApiEndpoint.getId(endpoint) === id
  ) as ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id> | undefined

  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`)
  }

  return endpoint
}

export const handle = <
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
) =>
<R1, E1>(
  builder: RouterBuilder.RouterBuilder<R1, E1, RemainingEndpoints>
): RouterBuilder.RouterBuilder<
  | Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>
  | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>,
  E1 | Exclude<E2, ServerError.ServerError>,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> => {
  const endpoint = getRemainingEndpoint(builder, id)
  const remainingEndpoints = removeRemainingEndpoint(builder, id)

  const router = addRoute(
    builder.router,
    Route.fromEndpoint(fn, builder.options)(endpoint)
  )

  return {
    ...builder,
    router,
    remainingEndpoints
  }
}

export const build = <R, E>(
  builder: RouterBuilder.RouterBuilder<R, E, never>
): App.Default<R | SwaggerRouter.SwaggerFiles, E> => buildPartial(builder)

export const buildPartial = <R, E, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  builder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
): App.Default<R | SwaggerRouter.SwaggerFiles, E> => {
  const swaggerRouter = builder.options.enableDocs ? SwaggerRouter.make(OpenApi.make(builder.api)) : Router.empty
  return Router.mount(builder.router, builder.options.docsPath, swaggerRouter).pipe(
    Effect.catchTag("RouteNotFound", () => ServerError.toServerResponse(ServerError.make(404, "Not Found")))
  )
}

export const getRouter = <R, E>(
  builder: RouterBuilder.RouterBuilder<R, E, any>
): Router.Router<R, E> => builder.router

/** @internal */
const removeRemainingEndpoint = <
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  builder: RouterBuilder.RouterBuilder<any, any, RemainingEndpoints>,
  id: Id
): Array<ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>> =>
  builder.remainingEndpoints.filter(
    (endpoint) => ApiEndpoint.getId(endpoint) !== id
  ) as Array<ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>>

/** @internal */
export const addRoute = <R1, R2, E1, E2>(
  router: Router.Router<R1, E1>,
  route: Router.Route<R2, E2>
): Router.Router<
  Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
  E1 | E2
> => Router.concat(Router.fromIterable([route]))(router) as any
