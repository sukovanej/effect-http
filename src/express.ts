import express from "express";
import { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import { flow, identity, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as S from "@effect/schema/Schema";

import { Endpoint, IgnoredSchemaId } from "./api";
import {
  ApiError,
  invalidBodyError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
} from "./errors";
import { serverError } from "./errors";
import { getSchema } from "./internal";
import { Handler, Server } from "./server";

const handleApiFailure = (
  method: OpenApi.OpenAPISpecMethodName,
  path: string,
  error: ApiError,
  statusCode: number,
  res: express.Response,
) =>
  pipe(
    Effect.logWarning(`${method} ${path} failed`),
    Effect.logAnnotate("errorTag", error._tag),
    Effect.logAnnotate("error", JSON.stringify(error.error, undefined)),
    Effect.flatMap(() =>
      Effect.try(() =>
        res.status(statusCode).send({
          error: error._tag,
          details: JSON.stringify(error.error, undefined),
        }),
      ),
    ),
    Effect.ignoreLogged,
  );

const toEndpoint = <E extends Endpoint>(
  { fn, endpoint: { schemas, path, method }, layer }: Handler<E, never>,
  logger: Logger.Logger<any, any>,
) => {
  const parseQuery = S.parseEffect(getSchema(schemas.query));
  const parseParams = S.parseEffect(getSchema(schemas.params));
  const parseBody = S.parseEffect(getSchema(schemas.body));
  const encodeResponse = S.parseEffect(schemas.response);

  return (req: express.Request, res: express.Response) =>
    pipe(
      Effect.Do(),
      Effect.bind("query", () =>
        pipe(parseQuery(req.query), Effect.mapError(invalidQueryError)),
      ),
      Effect.bind("params", () =>
        pipe(parseParams(req.params), Effect.mapError(invalidParamsError)),
      ),
      Effect.bind("body", () =>
        pipe(parseBody(req.body), Effect.mapError(invalidBodyError)),
      ),
      Effect.tap(() => Effect.logTrace(`${method} ${path}`)),
      Effect.flatMap((i: any) => fn(i)),
      Effect.flatMap(
        flow(encodeResponse, Effect.mapError(invalidResponseError)),
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.try(() => {
            res.status(200).json(response);
          }),
          Effect.mapError(serverError),
        ),
      ),
      Effect.catchTags({
        InvalidBodyError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidQueryError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidParamsError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidResponseError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        NotFoundError: (error) =>
          handleApiFailure(method, path, error, 404, res),
        ServerError: (error) => handleApiFailure(method, path, error, 500, res),
      }),
      Effect.catchAll((error) =>
        handleApiFailure(method, path, error, 500, res),
      ),
      Effect.provideLayer(Logger.replace(Logger.defaultLogger, logger)),
      layer === undefined ? identity : Effect.provideLayer(layer),
      Effect.runPromise as any,
    );
};

const handlerToRoute = <E extends Endpoint>(
  handler: Handler<E, never>,
  logger: Logger.Logger<any, any>,
): express.Router =>
  express
    .Router()
    [handler.endpoint.method](
      handler.endpoint.path,
      toEndpoint(handler, logger),
    );

const createSpec = <Hs extends Handler[]>(
  self: Server<[], Hs>,
): OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType> => {
  return self.handlers.reduce(
    (spec, { endpoint: { path, method, schemas, id } }) => {
      const operationSpec = [];

      if (schemas.response !== S.unknown) {
        operationSpec.push(
          OpenApi.jsonResponse(200, schemas.response, "Response"),
        );
      }

      if (schemas.params !== IgnoredSchemaId) {
        operationSpec.push(
          OpenApi.parameter("Path parameter", "path", schemas.params),
        );
      }

      if (schemas.query !== IgnoredSchemaId) {
        operationSpec.push(
          OpenApi.parameter("Query parameter", "query", schemas.query),
        );
      }

      if (schemas.body !== IgnoredSchemaId) {
        operationSpec.push(OpenApi.jsonRequest(schemas.body));
      }

      return OpenApi.path(
        path,
        OpenApi.operation(method, OpenApi.operationId(id), ...operationSpec),
      )(spec);
    },
    self.openApi,
  );
};

export const toExpress = <Hs extends Handler<any, never>[]>(
  self: Server<[], Hs>,
): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of self.handlers) {
    app.use(handlerToRoute(handler, self.logger));
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(createSpec(self)));

  return app;
};

export const listen =
  (port?: number) =>
  <S extends Server<[], Handler<Endpoint, never>[]>>(self: S) => {
    if (self._unimplementedEndpoints.length !== 0) {
      new Error(`All endpoint must be implemented`);
    }

    const server = toExpress(self);

    return Effect.tryPromise(
      () =>
        new Promise<AddressInfo>((resolve, reject) => {
          const listeningServer = server.listen(port);
          listeningServer.on("listening", () =>
            resolve(listeningServer.address() as AddressInfo),
          );
          listeningServer.on("error", reject);
        }),
    );
  };
