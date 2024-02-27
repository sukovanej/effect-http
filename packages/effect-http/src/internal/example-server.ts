import { ExampleCompiler } from "schema-openapi"

import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Api from "../Api.js"
import * as RouterBuilder from "../RouterBuilder.js"
import * as ServerError from "../ServerError.js"
import * as utils from "./utils.js"

export const make = <A extends Api.Api>(
  api: A
): RouterBuilder.RouterBuilder<
  Api.ApiRequirements<A>,
  never,
  never
> => handleRemaining(RouterBuilder.make(api))

export const handle = <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"]
>(id: Id) =>
<R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
): RouterBuilder.RouterBuilder<
  R | Api.EndpointRequirements<Extract<RemainingEndpoints, { id: Id }>>,
  E,
  Exclude<RemainingEndpoints, { id: Id }>
> => {
  const endpoint = Api.getEndpoint(routerBuilder.api, id)

  return pipe(
    routerBuilder,
    RouterBuilder.handle(id, createExampleHandler(endpoint))
  )
}

export const handleRemaining = <RemainingEndpoints extends Api.Endpoint, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
): RouterBuilder.RouterBuilder<R | Api.EndpointRequirements<RemainingEndpoints>, E, never> =>
  pipe(
    routerBuilder.remainingEndpoints,
    ReadonlyArray.reduce(
      routerBuilder as RouterBuilder.RouterBuilder<
        R | Api.EndpointRequirements<RemainingEndpoints>,
        E,
        RemainingEndpoints
      >,
      (server, endpoint) =>
        pipe(
          server,
          RouterBuilder.handle(endpoint.id, createExampleHandler(endpoint))
        )
    )
  ) as RouterBuilder.RouterBuilder<R | Api.EndpointRequirements<RemainingEndpoints>, E, never>

const createExampleHandler = ({ schemas }: Api.Endpoint) => {
  const responseSchema = utils.createResponseSchema(schemas.response)

  return () =>
    pipe(
      responseSchema && ExampleCompiler.randomExample(responseSchema) || Effect.unit,
      Effect.mapError((error) =>
        ServerError.internalServerError(
          `Sorry, I don't have any example response. ${JSON.stringify(error)}`
        )
      )
    )
}
