import express from "express";
import { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as S from "@effect/schema/Schema";

import { Endpoint, IgnoredSchemaId } from "./api";
import {
  ApiError,
  internalServerError,
  invalidBodyError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
  isConflictError,
  isInvalidBodyError,
  isInvalidParamsError,
  isInvalidQueryError,
  isInvalidResponseError,
} from "./errors";
import { getSchema } from "./internal";
import { openApi } from "./openapi";
import { Handler, Server } from "./server";
import {
  ValidationErrorFormatter,
  ValidationErrorFormatterService,
  isParseError,
} from "./validation-error-formatter";

const handleApiFailure = (
  method: OpenApi.OpenAPISpecMethodName,
  path: string,
  error: ApiError,
  statusCode: number,
  res: express.Response,
) =>
  Effect.flatMap(ValidationErrorFormatterService, (formatter) =>
    pipe(
      Effect.logWarning(`${method.toUpperCase()} ${path} failed`),
      Effect.flatMap(() =>
        pipe(
          Effect.try(() =>
            res.status(statusCode).send({
              error: error._tag,
              details: formatError(error, formatter),
            }),
          ),
          Effect.catchAll((error) =>
            pipe(
              Effect.logFatal("Error occured when sending failure response"),
              Effect.logAnnotate("error", formatError(error, formatter)),
            ),
          ),
        ),
      ),
      Effect.logAnnotate("errorTag", error._tag),
      Effect.logAnnotate("error", formatError(error, formatter)),
    ),
  );

const formatError = (error: unknown, formatter: ValidationErrorFormatter) => {
  const isValidationError =
    isInvalidQueryError(error) ||
    isInvalidBodyError(error) ||
    isInvalidResponseError(error) ||
    isInvalidParamsError(error) ||
    isConflictError(error);

  if (isValidationError) {
    const innerError = error.error;

    if (isParseError(innerError)) {
      return formatter(innerError);
    } else if (typeof innerError === "string") {
      return innerError;
    }
  }

  return JSON.stringify(error);
};

const errorToLog = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  if (["string", "number", "boolean"].includes(typeof error)) {
    return `${error}`;
  }

  return JSON.stringify(error, undefined);
};

const toEndpoint = <E extends Endpoint>(
  { fn, endpoint: { schemas, path, method } }: Handler<E, never>,
  logger: Logger.Logger<any, any>,
  errorFormatter: ValidationErrorFormatter,
) => {
  const parseQuery = S.parseEffect(
    schemas.query === IgnoredSchemaId
      ? S.unknown
      : (S.struct(schemas.query) as any),
  );
  const parseParams = S.parseEffect(
    schemas.params === IgnoredSchemaId
      ? S.unknown
      : (S.struct(schemas.params) as any),
  );
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
      Effect.tap(() => Effect.logTrace(`${method.toUpperCase()} ${path}`)),
      Effect.flatMap((i: any) => fn(i)),
      Effect.flatMap(
        flow(encodeResponse, Effect.mapError(invalidResponseError)),
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.try(() => {
            res.status(200).json(response);
          }),
          Effect.mapError(internalServerError),
        ),
      ),
      Effect.catchTags({
        InvalidBodyError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidQueryError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidParamsError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        NotFoundError: (error) =>
          handleApiFailure(method, path, error, 404, res),
        ConflictError: (error) =>
          handleApiFailure(method, path, error, 409, res),
        InvalidResponseError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        InternalServerError: (error) =>
          handleApiFailure(method, path, error, 500, res),
      }),
      Effect.catchAll((error) =>
        handleApiFailure(method, path, error, 500, res),
      ),
      Effect.catchAllDefect((error) =>
        pipe(
          Effect.logFatal("Defect occured when sending failure response"),
          Effect.logAnnotate("error", errorToLog(error)),
        ),
      ),
      Effect.provideService(ValidationErrorFormatterService, errorFormatter),
      Effect.provideLayer(Logger.replace(Logger.defaultLogger, logger)),
      Effect.runPromise as any,
    );
};

const handlerToRoute = <E extends Endpoint>(
  handler: Handler<E, never>,
  logger: Logger.Logger<any, any>,
  errorFormattter: ValidationErrorFormatter,
): express.Router =>
  express
    .Router()
    [handler.endpoint.method](
      handler.endpoint.path,
      toEndpoint(handler, logger, errorFormattter),
    );

export const toExpress = <Hs extends Handler<any, never>[]>(
  server: Server<[], Hs>,
): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of server.handlers) {
    app.use(
      handlerToRoute(handler, server.logger, server.validationErrorFormatter),
    );
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApi(server.api)));

  return app;
};

export const listen =
  (port?: number) =>
  <S extends Server<[], Handler<Endpoint, never>[]>>(server: S) => {
    if (server._unimplementedEndpoints.length !== 0) {
      new Error(`All endpoint must be implemented`);
    }

    const app = toExpress(server);

    return pipe(
      Effect.try(() => app.listen(port)),
      Effect.flatMap((listeningServer) =>
        Effect.async<never, Error, AddressInfo>((cb) => {
          listeningServer.on("listening", () => {
            const address = listeningServer.address();

            if (address === null) {
              cb(Effect.fail(new Error("Could not obtain an address")));
            } else if (typeof address === "string") {
              cb(
                Effect.fail(
                  new Error(`Unexpected obtained address: ${address}`),
                ),
              );
            } else {
              cb(Effect.succeed(address));
            }
          });
          listeningServer.on("error", (error) => cb(Effect.fail(error)));
        }),
      ),
      Effect.tap(({ address, port }) =>
        Effect.logInfo(`Server listening on ${address}:${port}`),
      ),
      Effect.provideLayer(Logger.replace(Logger.defaultLogger, server.logger)),
    );
  };
