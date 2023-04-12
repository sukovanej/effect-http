import express from "express";
import { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import { Endpoint } from "./api-types";
import {
  ApiError,
  invalidBodyError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
  unexpectedServerError,
} from "./errors";
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

const toEndpoint = <E extends Endpoint>({
  fn,
  endpoint: { schemas, path, method },
}: Handler<E, never>) => {
  const parseQuery = S.parseEffect(schemas.query);
  const parseParams = S.parseEffect(schemas.params);
  const parseBody = S.parseEffect(schemas.body);
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
      Effect.flatMap(fn),
      Effect.flatMap(
        flow(encodeResponse, Effect.mapError(invalidResponseError)),
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.try(() => {
            res.status(200).send(response);
          }),
          Effect.mapError(unexpectedServerError),
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
        UnexpectedServerError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        NotFoundError: (error) =>
          handleApiFailure(method, path, error, 404, res),
        ServerError: (error) => handleApiFailure(method, path, error, 500, res),
      }),
      Effect.runPromise,
    );
};

export const handlerToRoute = <E extends Endpoint>(
  handler: Handler<E, never>,
): express.Router =>
  express
    .Router()
    [handler.endpoint.method](handler.endpoint.path, toEndpoint(handler));

export const createSpec = <Hs extends Handler[]>(
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

      if (schemas.params !== S.unknown) {
        operationSpec.push(
          OpenApi.parameter("Path parameter", "path", schemas.params),
        );
      }

      if (schemas.query !== S.unknown) {
        operationSpec.push(
          OpenApi.parameter("Query parameter", "query", schemas.query),
        );
      }

      if (schemas.body !== S.unknown) {
        operationSpec.push(OpenApi.jsonRequest(schemas.body));
      }

      // TODO: add operation id

      return OpenApi.path(
        path,
        OpenApi.operation(method, ...operationSpec),
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
    app.use(handlerToRoute(handler));
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(createSpec(self)));

  return app;
};

export const listen =
  (port: number) =>
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
