import { ExampleCompiler } from "schema-openapi"

import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Unify from "effect/Unify"
import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as RouterBuilder from "../RouterBuilder.js"
import * as ServerError from "../ServerError.js"
import * as utils from "./utils.js"

export const make = <A extends Api.Api.Any>(
  api: A
): RouterBuilder.RouterBuilder<
  Api.Api.Content<A>,
  never,
  never
> => handleRemaining(RouterBuilder.make(api))

export const handle = <
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(id: Id) =>
<R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
): RouterBuilder.RouterBuilder<
  R | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>,
  E,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> => {
  const endpoint = Api.getEndpoint(routerBuilder.api, id)

  return pipe(
    routerBuilder,
    RouterBuilder.handle(id, createExampleHandler(endpoint) as any)
  ) as any
}

export const handleRemaining = <RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
): RouterBuilder.RouterBuilder<R | ApiEndpoint.ApiEndpoint.Context<RemainingEndpoints>, E, never> =>
  pipe(
    routerBuilder.remainingEndpoints,
    Array.reduce(
      routerBuilder as RouterBuilder.RouterBuilder<
        R | ApiEndpoint.ApiEndpoint.Context<RemainingEndpoints>,
        E,
        RemainingEndpoints
      >,
      (server, endpoint) =>
        pipe(
          server,
          RouterBuilder.handle(ApiEndpoint.getId(endpoint) as any, createExampleHandler(endpoint) as any)
        ) as any
    )
  ) as RouterBuilder.RouterBuilder<R | ApiEndpoint.ApiEndpoint.Context<RemainingEndpoints>, E, never>

const createExampleHandler = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const responseSchema = utils.createResponseSchema(endpoint)

  return () =>
    pipe(
      Unify.unify(responseSchema && ExampleCompiler.randomExample(responseSchema) || Effect.void),
      Effect.mapError((error) =>
        ServerError.internalServerError(
          `Sorry, I don't have any example response. ${JSON.stringify(error)}`
        )
      )
    )
}
