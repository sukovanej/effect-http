import * as OpenApiExamples from "schema-openapi/dist/example-compiler";

import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";

import { Api, Endpoint } from "./api";
import { serverError } from "./errors";
import { Server, handle, server } from "./server";

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

const createExampleHandler = (endpoint: Endpoint) => {
  const examples = OpenApiExamples.examples(endpoint.schemas.response);

  return () => {
    const randomIndex = Math.round(Math.random() * (examples.length - 1));

    if (randomIndex < 0) {
      return Effect.fail(
        serverError("Sorry, I don't have any example response"),
      );
    }

    return Effect.succeed(examples[randomIndex]);
  };
};
