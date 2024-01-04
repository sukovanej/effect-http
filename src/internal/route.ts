import type * as Method from "@effect/platform/Http/Method"
import * as Router from "@effect/platform/Http/Router"
import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as Effect from "effect/Effect"
import * as Api from "../Api.js"
import type * as Route from "../Route.js"
import type * as RouterBuilder from "../RouterBuilder.js"
import * as ServerError from "../ServerError.js"
import * as ServerRequestParser from "./serverRequestParser.js"
import * as ServerResponseEncoder from "./serverResponseEncoder.js"

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromEndpoint: <Endpoint extends Api.Endpoint, R, E>(
  fn: Route.HandlerFunction<Endpoint, R, E>,
  options?: RouterBuilder.Options
) => (
  endpoint: Endpoint
) => Router.Route<R, Exclude<E, ServerError.ServerError>> = <Endpoint extends Api.Endpoint, R, E>(
  fn: Route.HandlerFunction<Endpoint, R, E>,
  options?: RouterBuilder.Options
) =>
(endpoint) => {
  const responseEncoder = ServerResponseEncoder.create(
    endpoint.schemas.response
  )
  const requestParser = ServerRequestParser.create(
    endpoint,
    options?.parseOptions
  )

  return Router.makeRoute(
    endpoint.method.toUpperCase() as Method.Method,
    endpoint.path,
    Effect.gen(function*(_) {
      const request = yield* _(ServerRequest.ServerRequest)
      const context = yield* _(Router.RouteContext)
      const response = yield* _(
        requestParser.parseRequest(request, context),
        Effect.flatMap((input: any) => fn(input))
      )
      return yield* _(responseEncoder.encodeResponse(request, response))
    }).pipe(
      Effect.catchAll((error) => {
        if (ServerError.isServerError(error)) {
          return ServerError.toServerResponse(error)
        }

        return Effect.fail(error as Exclude<E, ServerError.ServerError>)
      })
    )
  )
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <
  A extends Api.Api,
  Id extends A["endpoints"][number]["id"],
  R,
  E
>(
  id: Id,
  fn: Route.HandlerFunction<Extract<A["endpoints"][number], { id: Id }>, R, E>,
  options?: RouterBuilder.Options
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>> = (id, fn, options) => (api) => {
  const endpoint = Api.getEndpoint(api, id)

  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`)
  }

  return fromEndpoint(fn, options)(endpoint)
}
