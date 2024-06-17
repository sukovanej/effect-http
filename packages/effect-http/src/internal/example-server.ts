import { ExampleCompiler } from "schema-openapi"

import * as HttpError from "effect-http-error/HttpError"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Unify from "effect/Unify"
import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as RouterBuilder from "../RouterBuilder.js"
import * as utils from "./utils.js"

export const make = <A extends Api.Api.Any>(
  api: A
): RouterBuilder.RouterBuilder<
  Api.Api.Context<A>,
  never,
  never
> => handleRemaining(RouterBuilder.make(api))

export const handle = <
  A extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<A>
>(id: Id) =>
<R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<A, E, R>
): RouterBuilder.RouterBuilder<
  ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>,
  E,
  R | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<A, Id>>
> => {
  const endpoint = Api.getEndpoint(routerBuilder.api, id)

  return pipe(
    routerBuilder,
    RouterBuilder.handle(id, createExampleHandler(endpoint) as any)
  ) as any
}

export const handleRemaining = <A extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<A, E, R>
): RouterBuilder.RouterBuilder<never, E, R | ApiEndpoint.ApiEndpoint.Context<A>> =>
  pipe(
    routerBuilder.remainingEndpoints,
    Array.reduce(
      routerBuilder as RouterBuilder.RouterBuilder<A, E, R | ApiEndpoint.ApiEndpoint.Context<A>>,
      (server, endpoint) =>
        pipe(
          server,
          RouterBuilder.handle(ApiEndpoint.getId(endpoint) as any, createExampleHandler(endpoint) as any)
        ) as any
    )
  ) as RouterBuilder.RouterBuilder<never, E, R | ApiEndpoint.ApiEndpoint.Context<A>>

const createExampleHandler = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const responseSchema = utils.createResponseSchema(endpoint)

  return () =>
    pipe(
      Unify.unify(responseSchema && ExampleCompiler.randomExample(responseSchema) || Effect.void),
      Effect.mapError((error) =>
        HttpError.internalHttpError(
          `Sorry, I don't have any example response. ${JSON.stringify(error)}`
        )
      )
    )
}
