import * as OpenApi from "schema-openapi";

import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import { type Api, type Endpoint, IgnoredSchemaId } from "effect-http/Api";
import { ServerBuilder, handle, server } from "effect-http/ServerBuilder";
import { internalServerError } from "effect-http/ServerError";

import { isArray } from "./utils";

/** @internal */
export const exampleServer = <A extends Api>(
  api: A,
): ServerBuilder<never, [], A> => {
  const _server = server(api);

  return pipe(
    _server.unimplementedEndpoints,
    RA.reduce(_server, (server, endpoint) =>
      pipe(server, handle(endpoint.id, createExampleHandler(endpoint)) as any),
    ),
  ) as any;
};

/** @internal */
const createExampleHandler = ({ schemas }: Endpoint) => {
  const getSchema = () => {
    if (isArray(schemas.response)) {
      return Schema.union(
        ...schemas.response.map(({ status, content, headers }) =>
          Schema.struct({
            status: Schema.literal(status),
            content: content === IgnoredSchemaId ? Schema.undefined : content,
            headers: headers === IgnoredSchemaId ? Schema.undefined : headers,
          }),
        ),
      );
    }

    return schemas.response;
  };

  const responseSchema = getSchema();

  return () =>
    pipe(
      OpenApi.randomExample(responseSchema),
      Effect.mapError(() =>
        internalServerError("Sorry, I don't have any example response"),
      ),
    );
};
