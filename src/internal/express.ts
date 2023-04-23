import { ExpressOptions } from "effect-http/Express";
import express from "express";
import type { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as Schema from "@effect/schema/Schema";

import type { Endpoint } from "../Api";
import { openApi } from "../OpenApi";
import {
  API_STATUS_CODES,
  ApiError,
  Handler,
  Server,
  internalServerError,
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
  isConflictError,
  isInvalidBodyError,
  isInvalidHeadersError,
  isInvalidParamsError,
  isInvalidQueryError,
  isInvalidResponseError,
} from "../Server";
import {
  ValidationErrorFormatter,
  ValidationErrorFormatterService,
  isParseError,
} from "../validation-error-formatter";
import { getSchema, getStructSchema } from "./utils";

/** @internal */
export const DEFAULT_OPTIONS = {
  openapiEnabled: true,
  openapiPath: "/docs",
} satisfies ExpressOptions;

/** @internal */
const formatError = (error: unknown, formatter: ValidationErrorFormatter) => {
  const isValidationError =
    isInvalidQueryError(error) ||
    isInvalidBodyError(error) ||
    isInvalidResponseError(error) ||
    isInvalidParamsError(error) ||
    isInvalidHeadersError(error) ||
    isConflictError(error);

  if (isValidationError) {
    const innerError = error.error;

    if (isParseError(innerError)) {
      return formatter(innerError);
    } else if (typeof innerError === "string") {
      return innerError;
    }
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    if (typeof error.error === "string") {
      return error.error;
    }

    return JSON.stringify(error.error);
  }

  return JSON.stringify(error);
};

/** @internal */
const errorToLog = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  if (["string", "number", "boolean"].includes(typeof error)) {
    return `${error}`;
  }

  return JSON.stringify(error, undefined);
};

/** @internal */
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
      Effect.asUnit,
    ),
  );

/** @internal */
const toEndpoint = <E extends Endpoint>(
  { fn, endpoint: { schemas, path, method } }: Handler<E, never>,
  logger: Logger.Logger<any, any>,
  errorFormatter: ValidationErrorFormatter,
) => {
  const parseQuery = Schema.parseEffect(getStructSchema(schemas.query));
  const parseParams = Schema.parseEffect(getStructSchema(schemas.params));
  const parseHeaders = Schema.parseEffect(getStructSchema(schemas.headers));
  const parseBody = Schema.parseEffect(getSchema(schemas.body));
  const encodeResponse = Schema.parseEffect(schemas.response);

  return (req: express.Request, res: express.Response) =>
    pipe(
      Effect.all({
        query: Effect.mapError(parseQuery(req.query), invalidQueryError),
        params: Effect.mapError(parseParams(req.params), invalidParamsError),
        body: Effect.mapError(parseBody(req.body), invalidBodyError),
        headers: Effect.mapError(
          parseHeaders(req.headers),
          invalidHeadersError,
        ),
      }),
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
      Effect.catchAll((error) =>
        handleApiFailure(
          method,
          path,
          error,
          API_STATUS_CODES[error._tag],
          res,
        ),
      ),
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
      Effect.runPromise,
    );
};

/** @internal */
export const handlerToRoute = <E extends Endpoint>(
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

/** @internal */
export const toExpress =
  (options?: Partial<ExpressOptions>) =>
  <Hs extends Handler<any, never>[]>(
    server: Server<[], Hs>,
  ): express.Express => {
    const app = express();
    app.use(express.json());

    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    for (const handler of server.handlers) {
      app.use(
        handlerToRoute(handler, server.logger, server.validationErrorFormatter),
      );
    }

    if (finalOptions.openapiEnabled) {
      app.use(
        finalOptions.openapiPath,
        swaggerUi.serve,
        swaggerUi.setup(openApi(server.api)),
      );
    }

    return app;
  };

/** @internal */
export const listen =
  (port?: number, options?: Partial<ExpressOptions>) =>
  <S extends Server<[], Handler<Endpoint, never>[]>>(server: S) => {
    if (server._unimplementedEndpoints.length !== 0) {
      new Error(`All endpoint must be implemented`);
    }

    const app = toExpress(options)(server);

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
