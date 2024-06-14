import type * as App from "@effect/platform/Http/App"
import * as Router from "@effect/platform/Http/Router"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as HttpError from "effect-http-error/HttpError"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Pipeable from "effect/Pipeable"
import type * as Scope from "effect/Scope"

import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as Handler from "../Handler.js"
import * as OpenApi from "../OpenApi.js"
import type * as RouterBuilder from "../RouterBuilder.js"
import * as SwaggerRouter from "../SwaggerRouter.js"

/** @internal */
const DEFAULT_OPTIONS: RouterBuilder.Options = {
  parseOptions: { errors: "first", onExcessProperty: "ignore" },
  enableDocs: true,
  docsPath: "/docs"
}

/** @internal */
class RouterBuilderImpl<R, E, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>
  implements RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>, Pipeable.Pipeable
{
  constructor(
    readonly remainingEndpoints: ReadonlyArray<RemainingEndpoints>,
    readonly api: Api.Api.Any,
    readonly router: Router.Router<E, R>,
    readonly options: RouterBuilder.Options
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const make = <A extends Api.Api.Any>(
  api: A,
  options?: Partial<RouterBuilder.Options>
): RouterBuilder.RouterBuilder<never, never, Api.Api.Endpoints<A>> =>
  new RouterBuilderImpl(
    api.groups.flatMap((group) => group.endpoints) as any,
    api,
    Router.empty,
    { ...DEFAULT_OPTIONS, ...options }
  )

/** @internal */
export const handleRaw = <
  R2,
  E2,
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  id: Id,
  handler: Router.Route.Handler<E2, R2>
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

  return new RouterBuilderImpl(remainingEndpoints, builder.api, router, builder.options)
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

/** @internal */
export const handle = (...args: Array<any>) => (builder: RouterBuilder.RouterBuilder.Any): any => {
  if (args.length === 2) {
    const [id, handler] = args
    const endpoint = getRemainingEndpoint(builder, id)
    return handle(Handler.make(endpoint, handler))(builder)
  }

  const handler = args[0] as Handler.Handler.Any
  const remainingEndpoints = removeRemainingEndpoint(
    builder,
    ApiEndpoint.getId(Handler.getEndpoint(handler))
  )
  const router = addRoute(builder.router, Handler.getRoute(handler))

  return new RouterBuilderImpl(remainingEndpoints, builder.api, router, builder.options)
}

/** @internal */
export const handler = <R, E, A extends Api.Api.Any, Id extends Api.Api.Ids<A>>(
  api: A,
  id: Id,
  handler: Handler.Handler.Function<Api.Api.EndpointById<A, Id>, E, R>
): Handler.Handler<Api.Api.EndpointById<A, Id>, E, R> => Handler.make(Api.getEndpoint(api, id), handler)

/** @internal */
export const build = <R, E>(
  builder: RouterBuilder.RouterBuilder<R, E, never>
): App.Default<E, R | SwaggerRouter.SwaggerFiles> => buildPartial(builder)

/** @internal */
export const buildPartial = <R, E, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  builder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
): App.Default<E, R | SwaggerRouter.SwaggerFiles> => {
  const swaggerRouter = builder.options.enableDocs ? SwaggerRouter.make(OpenApi.make(builder.api)) : Router.empty
  return Router.mount(builder.router, builder.options.docsPath, swaggerRouter).pipe(
    Effect.catchTag("RouteNotFound", () => HttpError.toResponse(HttpError.make(404, "Not Found")))
  )
}

/** @internal */
export const getRouter = <R, E>(
  builder: RouterBuilder.RouterBuilder<R, E, any>
): Router.Router<E, R> => builder.router

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
  router: Router.Router<E1, R1>,
  route: Router.Route<E2, R2>
): Router.Router<
  E1 | E2,
  Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>
> => Router.concat(Router.fromIterable([route]))(router) as any

/** @internal */
export const merge: {
  <R1, E1, R2, E2, A1 extends ApiEndpoint.ApiEndpoint.Any, A2 extends ApiEndpoint.ApiEndpoint.Any>(
    builder1: RouterBuilder.RouterBuilder<R1, E1, A1>,
    builder2: RouterBuilder.RouterBuilder<R2, E2, A2>
  ): RouterBuilder.RouterBuilder<R1 | R2, E1 | E2, RouterBuilder.RouterBuilder.MergeApiEndpoints<A1, A2>>
  <R2, E2, A2 extends ApiEndpoint.ApiEndpoint.Any>(
    builder2: RouterBuilder.RouterBuilder<R2, E2, A2>
  ): <R1, E1, A1 extends ApiEndpoint.ApiEndpoint.Any>(
    builder1: RouterBuilder.RouterBuilder<R1, E1, A1>
  ) => RouterBuilder.RouterBuilder<R1 | R2, E1 | E2, RouterBuilder.RouterBuilder.MergeApiEndpoints<A1, A2>>
} = dual(2, (builder1: RouterBuilder.RouterBuilder.Any, builder2: RouterBuilder.RouterBuilder.Any) => {
  const remainingEndpointIds = builder2.remainingEndpoints.map((e) => ApiEndpoint.getId(e))

  if (builder1.api !== builder2.api) {
    throw new Error("Cannot merge router builder for different APIs")
  }

  return new RouterBuilderImpl(
    builder1.remainingEndpoints.filter((e) => remainingEndpointIds.includes(ApiEndpoint.getId(e))) as any,
    builder1.api,
    Router.concat(builder1.router, builder2.router),
    builder1.options
  )
})
