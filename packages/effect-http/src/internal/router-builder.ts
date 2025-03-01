import type * as HttpApp from "@effect/platform/HttpApp"
import * as HttpRouter from "@effect/platform/HttpRouter"
import type * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Pipeable from "effect/Pipeable"
import type * as Scope from "effect/Scope"

import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as Handler from "../Handler.js"
import * as HttpError from "../HttpError.js"
import * as OpenApi from "../OpenApi.js"
import type * as RouterBuilder from "../RouterBuilder.js"
import * as SwaggerRouter from "../SwaggerRouter.js"

/** @internal */
export const TypeId: RouterBuilder.TypeId = Symbol.for(
  "effect-http/RouterBuilder/TypeId"
) as RouterBuilder.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _A: (_: never) => _,
  /* c8 ignore next */
  _E: (_: never) => _,
  /* c8 ignore next */
  _R: (_: any) => _
}

/** @internal */
const DEFAULT_OPTIONS: RouterBuilder.Options = {
  parseOptions: { errors: "first", onExcessProperty: "ignore" },
  enableDocs: true,
  docsPath: "/docs"
}

/** @internal */
class RouterBuilderImpl<A extends ApiEndpoint.ApiEndpoint.Any, E, R>
  implements RouterBuilder.RouterBuilder<A, E, R>, Pipeable.Pipeable
{
  readonly [TypeId] = variance

  constructor(
    readonly remainingEndpoints: ReadonlyArray<A>,
    readonly api: Api.Api.Any,
    readonly router: HttpRouter.HttpRouter<E, R>,
    readonly options: RouterBuilder.Options
  ) {}

  pipe() {
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const make = <A extends Api.Api.Any>(
  api: A,
  options?: Partial<RouterBuilder.Options>
): RouterBuilder.RouterBuilder<Api.Api.Endpoints<A>, never, never> =>
  new RouterBuilderImpl(
    api.groups.flatMap((group) => group.endpoints) as any,
    api,
    HttpRouter.empty,
    { ...DEFAULT_OPTIONS, ...options }
  )

/** @internal */
export const handleRaw = <A extends ApiEndpoint.ApiEndpoint.Any, E2, R2, Id extends ApiEndpoint.ApiEndpoint.Id<A>>(
  id: Id,
  handler: HttpRouter.Route.Handler<E2, R2>
) =>
<E1, R1>(builder: RouterBuilder.RouterBuilder<A, E1, R1>): RouterBuilder.RouterBuilder<
  ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>,
  E1 | E2,
  R1 | Exclude<R2, HttpRouter.RouteContext | HttpServerRequest.HttpServerRequest | Scope.Scope>
> => {
  const endpoint = getRemainingEndpoint(builder, id)
  const remainingEndpoints = removeRemainingEndpoint(builder, id)

  const router = builder.router.pipe(
    HttpRouter.route(ApiEndpoint.getMethod(endpoint))(
      ApiEndpoint.getPath(endpoint),
      handler
    )
  )

  return new RouterBuilderImpl(remainingEndpoints, builder.api, router, builder.options)
}

/** @internal */
const getRemainingEndpoint = <
  A extends ApiEndpoint.ApiEndpoint.Any,
  E,
  R,
  Id extends ApiEndpoint.ApiEndpoint.Id<A>
>(
  builder: RouterBuilder.RouterBuilder<A, E, R>,
  id: Id
): ApiEndpoint.ApiEndpoint.ExtractById<A, Id> => {
  const endpoint = builder.remainingEndpoints.find(
    (endpoint) => ApiEndpoint.getId(endpoint) === id
  ) as ApiEndpoint.ApiEndpoint.ExtractById<A, Id> | undefined

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
  const handlerEndpointIds = Handler.getEndpoints(handler).map((e) => ApiEndpoint.getId(e))
  const remainingEndpoints = builder.remainingEndpoints.filter((e1) =>
    !handlerEndpointIds.includes(ApiEndpoint.getId(e1))
  )
  const router = HttpRouter.concat(builder.router, Handler.getRouter(handler))

  return new RouterBuilderImpl(remainingEndpoints, builder.api, router, builder.options)
}

/** @internal */
export const handler = <A extends Api.Api.Any, E, R, Id extends Api.Api.Ids<A>>(
  api: A,
  id: Id,
  handler: Handler.Handler.Function<Api.Api.EndpointById<A, Id>, E, R>
): Handler.Handler<Api.Api.EndpointById<A, Id>, E, R> => Handler.make(Api.getEndpoint(api, id), handler)

/** @internal */
export const mapRouter = <A extends ApiEndpoint.ApiEndpoint.Any, E1, E2, R1, R2>(
  fn: (router: HttpRouter.HttpRouter<E1, R1>) => HttpRouter.HttpRouter<E2, R2>
) =>
(
  builder: RouterBuilder.RouterBuilder<A, E1, R1>
): RouterBuilder.RouterBuilder<A, E2, R2> =>
  new RouterBuilderImpl(builder.remainingEndpoints, builder.api, fn(builder.router), builder.options)

/** @internal */
export const build = <R, E>(
  builder: RouterBuilder.RouterBuilder<never, E, R>
): HttpApp.Default<E, R | SwaggerRouter.SwaggerFiles> => buildPartial(builder)

/** @internal */
export const buildPartial = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  builder: RouterBuilder.RouterBuilder<A, E, R>
): HttpApp.Default<E, R | SwaggerRouter.SwaggerFiles> => {
  const swaggerRouter = builder.options.enableDocs ? SwaggerRouter.make(OpenApi.make(builder.api)) : HttpRouter.empty
  return HttpRouter.mount(builder.router, builder.options.docsPath, swaggerRouter).pipe(
    Effect.catchTag("RouteNotFound", () => HttpError.toResponse(HttpError.make(404, "Not Found")))
  )
}

/** @internal */
export const getRouter = <E, R>(
  builder: RouterBuilder.RouterBuilder<any, E, R>
): HttpRouter.HttpRouter<E, R> => builder.router

/** @internal */
const removeRemainingEndpoint = <A extends ApiEndpoint.ApiEndpoint.Any, Id extends ApiEndpoint.ApiEndpoint.Id<A>>(
  builder: RouterBuilder.RouterBuilder<A, any, any>,
  id: Id
): Array<ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>> =>
  builder.remainingEndpoints.filter(
    (endpoint) => ApiEndpoint.getId(endpoint) !== id
  ) as Array<ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>>

/** @internal */
export const addRoute = <E1, E2, R1, R2>(
  router: HttpRouter.HttpRouter<E1, R1>,
  route: HttpRouter.Route<E2, R2>
): HttpRouter.HttpRouter<
  E1 | E2,
  Exclude<R1 | R2, HttpRouter.RouteContext | HttpServerRequest.HttpServerRequest>
> => HttpRouter.concat(HttpRouter.fromIterable([route]))(router) as any

/** @internal */
export const merge: {
  <R1, E1, R2, E2, A1 extends ApiEndpoint.ApiEndpoint.Any, A2 extends ApiEndpoint.ApiEndpoint.Any>(
    builder1: RouterBuilder.RouterBuilder<A1, E1, R1>,
    builder2: RouterBuilder.RouterBuilder<A2, E2, R2>
  ): RouterBuilder.RouterBuilder<RouterBuilder.RouterBuilder.MergeApiEndpoints<A1, A2>, E1 | E2, R1 | R2>
  <R2, E2, A2 extends ApiEndpoint.ApiEndpoint.Any>(
    builder2: RouterBuilder.RouterBuilder<A2, E2, R2>
  ): <R1, E1, A1 extends ApiEndpoint.ApiEndpoint.Any>(
    builder1: RouterBuilder.RouterBuilder<A1, E1, R1>
  ) => RouterBuilder.RouterBuilder<RouterBuilder.RouterBuilder.MergeApiEndpoints<A1, A2>, E1 | E2, R1 | R2>
} = dual(2, (builder1: RouterBuilder.RouterBuilder.Any, builder2: RouterBuilder.RouterBuilder.Any) => {
  const remainingEndpointIds = builder2.remainingEndpoints.map((e) => ApiEndpoint.getId(e))

  if (builder1.api !== builder2.api) {
    throw new Error("Cannot merge router builder for different APIs")
  }

  return new RouterBuilderImpl(
    builder1.remainingEndpoints.filter((e) => remainingEndpointIds.includes(ApiEndpoint.getId(e))) as any,
    builder1.api,
    HttpRouter.concat(builder1.router, builder2.router),
    builder1.options
  )
})

/** @internal */
export const isRouterBuilder = (u: unknown): u is RouterBuilder.RouterBuilder.Any =>
  typeof u === "object" && u !== null && TypeId in u
