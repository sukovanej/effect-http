import * as OpenApi from "schema-openapi";

import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";

import { Api, Endpoint } from "./Api";
import { Server, handle, internalServerError, server } from "./Server";

/** Generate an example Server implementation. */
export const exampleServer = (api: Api): Server<[], any> => {
  const _server = server(api);

  return pipe(
    _server._unimplementedEndpoints,
    RA.reduce(_server, (server, endpoint) =>
      pipe(server, handle(endpoint.id, createExampleHandler(endpoint)) as any),
    ),
  ) as Server<[], any>;
};

const createExampleHandler = (endpoint: Endpoint) => () =>
  pipe(
    OpenApi.randomExample(endpoint.schemas.response),
    Effect.mapError(() =>
      internalServerError("Sorry, I don't have any example response"),
    ),
  );
