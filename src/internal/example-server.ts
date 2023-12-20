import * as OpenApi from "schema-openapi";

import * as Api from "../Api.js";
import * as RouterBuilder from "../RouterBuilder.js";
import * as ServerError from "../ServerError.js";
import * as utils from "./utils.js";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as ReadonlyArray from "effect/ReadonlyArray";

export const make = <A extends Api.Api>(
  api: A,
): RouterBuilder.RouterBuilder<never, never, never> =>
  handleRemaining(RouterBuilder.make(api));

export const handle =
  <
    RemainingEndpoints extends Api.Endpoint,
    Id extends RemainingEndpoints["id"],
  >(
    id: Id,
  ) =>
  <R, E>(
    routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>,
  ): RouterBuilder.RouterBuilder<
    R,
    E,
    Exclude<RemainingEndpoints, { id: Id }>
  > => {
    const endpoint = Api.getEndpoint(routerBuilder.api, id);

    return pipe(
      routerBuilder,
      RouterBuilder.handle(id, createExampleHandler(endpoint)),
    );
  };

export const handleRemaining = <RemainingEndpoints extends Api.Endpoint, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>,
): RouterBuilder.RouterBuilder<R, E, never> =>
  pipe(
    routerBuilder.remainingEndpoints,
    ReadonlyArray.reduce(routerBuilder, (server, endpoint) =>
      pipe(
        server,
        RouterBuilder.handle(endpoint.id, createExampleHandler(endpoint)),
      ),
    ),
  ) as RouterBuilder.RouterBuilder<R, E, never>;

const createExampleHandler = ({ schemas }: Api.Endpoint) => {
  const responseSchema = utils.createResponseSchema(schemas.response);

  return () =>
    pipe(
      OpenApi.randomExample(responseSchema),
      Effect.mapError((error) =>
        ServerError.internalServerError(
          `Sorry, I don't have any example response. ${JSON.stringify(error)}`,
        ),
      ),
    );
};
