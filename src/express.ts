import express from "express";
import { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import { flow, identity, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as S from "@effect/schema/Schema";

import { Endpoint } from "./api";
import {
  ApiError,
  invalidBodyError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
} from "./errors";
import { serverError } from "./errors";
import { getSchema } from "./internal";
import { openApi } from "./openapi";
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
    Effect.logAnnotate("error", errorToLog(error.error)),
    Effect.flatMap(() =>
      Effect.try(() =>
        res.status(statusCode).send({
          error: error._tag,
          details: errorToDetails(error.error),
        }),
      ),
    ),
    Effect.ignoreLogged,
  );

const errorToDetails = (error: unknown): unknown => {
  if (["string", "number", "boolean", "object"].includes(typeof error)) {
    return error;
  }

  return JSON.stringify(error, undefined);
};

const errorToLog = (error: unknown): string => {
  if (["string", "number", "boolean"].includes(typeof error)) {
    return `${error}`;
  }

  return JSON.stringify(error, undefined);
};

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

export const toExpress = <Hs extends Handler<any, never>[]>(
  server: Server<[], Hs>,
): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of server.handlers) {
    app.use(handlerToRoute(handler, server.logger));
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApi(server.api)));

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
