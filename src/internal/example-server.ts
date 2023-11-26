import * as OpenApi from "schema-openapi";

import type * as Api from "effect-http/Api";
import * as RouterBuilder from "effect-http/RouterBuilder";
import * as ServerError from "effect-http/ServerError";
import * as utils from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as ReadonlyArray from "effect/ReadonlyArray";

export const make = <A extends Api.Api>(
  api: A,
): RouterBuilder.RouterBuilder<never, never, never> => {
  const _server = RouterBuilder.make(api);

  return pipe(
    _server.remainingEndpoints,
    ReadonlyArray.reduce(_server, (server, endpoint) =>
      pipe(
        server,
        RouterBuilder.handle(endpoint.id, createExampleHandler(endpoint)),
      ),
    ),
  ) as any;
};

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

