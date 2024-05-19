import * as Router from "@effect/platform/Http/Router"
import * as HttpError from "effect-http-error/HttpError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as Route from "../Route.js"
import type * as RouterBuilder from "../RouterBuilder.js"
import * as ServerRequestParser from "./serverRequestParser.js"
import * as ServerResponseEncoder from "./serverResponseEncoder.js"

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromEndpoint: <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  fn: Route.HandlerFunction<Endpoint, R, E>,
  options?: Partial<RouterBuilder.Options>
) => (
  endpoint: Endpoint
) => Router.Route<Exclude<E, HttpError.HttpError>, R> = <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  fn: Route.HandlerFunction<Endpoint, R, E>,
  options?: Partial<RouterBuilder.Options>
) =>
(endpoint) => {
  const responseEncoder = ServerResponseEncoder.create(endpoint)
  const requestParser = ServerRequestParser.create(endpoint, options?.parseOptions)

  return Router.makeRoute(
    ApiEndpoint.getMethod(endpoint),
    ApiEndpoint.getPath(endpoint),
    pipe(
      requestParser.parseRequest,
      Effect.flatMap((input: any) => {
        const { security, ...restInput } = input
        return fn(restInput, security)
      }),
      Effect.flatMap((response) => responseEncoder.encodeResponse(response)),
      Effect.catchAll((error) => {
        if (HttpError.isHttpError(error)) {
          return HttpError.toResponse(error)
        }

        return Effect.fail(error as Exclude<E, HttpError.HttpError>)
      })
    )
  )
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any, Id extends Api.Api.Ids<A>, R, E>(
  id: Id,
  fn: Route.HandlerFunction<Api.Api.EndpointById<A, Id>, R, E>,
  options?: Partial<RouterBuilder.Options>
) => (api: A) => Router.Route<Exclude<E, HttpError.HttpError>, R> = (id, fn, options) => (api) => {
  const endpoint = Api.getEndpoint(api, id)

  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`)
  }

  return fromEndpoint(fn, options)(endpoint)
}
