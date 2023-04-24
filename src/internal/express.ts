import * as Log from "effect-log";
import express from "express";
import http from "http";
import type { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Logger from "@effect/io/Logger";
import * as Runtime from "@effect/io/Runtime";
import * as Scope from "@effect/io/Scope";
import * as Schema from "@effect/schema/Schema";

import type { ExpressOptions, ListenOptions } from "../Express";
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
  defaultValidationErrorFormatterServer,
  isParseError,
} from "../Server/ValidationErrorFormatter";
import { getSchema, getStructSchema } from "./utils";

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
const toEndpoint = (
  { fn, endpoint: { schemas, path, method } }: Handler,
  runtime: Runtime.Runtime<any>,
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
      Effect.flatMap((i: any) => fn(i) as Effect.Effect<never, ApiError, void>),
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
      Runtime.runPromise(runtime),
    );
};

/** @internal */
export const toExpress =
  (options?: Partial<ExpressOptions>) =>
  <R>(server: Server<R, []>): Effect.Effect<R, unknown, express.Express> => {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    return pipe(
      Effect.gen(function* ($) {
        const runtime = yield* $(Effect.runtime<R>());

        const app = express();
        app.use(express.json());

        for (const handler of server.handlers) {
          const router = express
            .Router()
            [handler.endpoint.method](
              handler.endpoint.path,
              toEndpoint(handler, runtime),
            );
          app.use(router);
        }

        if (finalOptions.openapiEnabled) {
          app.use(
            finalOptions.openapiPath,
            swaggerUi.serve,
            swaggerUi.setup(openApi(server.api)),
          );
        }

        return app;
      }),
      Effect.provideSomeLayer(
        Layer.succeed(
          ValidationErrorFormatterService,
          finalOptions.validationErrorFormatter,
        ),
      ),
      Effect.provideSomeLayer(
        Logger.replace(
          Logger.defaultLogger,
          getLoggerFromOptions(finalOptions.logger),
        ),
      ),
    );
  };

/** @internal */
export const DEFAULT_OPTIONS = {
  openapiEnabled: true,
  openapiPath: "/docs",
  validationErrorFormatter: defaultValidationErrorFormatterServer,
  logger: "pretty",
} satisfies ExpressOptions;

/** @internal */
const DEFAULT_LOGGERS = {
  default: Logger.defaultLogger,
  pretty: Log.pretty,
  json: Log.json(),
  none: Logger.none(),
};

/** @internal */
const getLoggerFromOptions = (logger: ExpressOptions["logger"]) => {
  if (typeof logger === "string") {
    return DEFAULT_LOGGERS[logger];
  }

  return logger;
};

/** @internal */
export const listen =
  (options?: Partial<ListenOptions>) =>
  <R>(server: Server<R, []>): Effect.Effect<R, unknown, void> => {
    if (server._unimplementedEndpoints.length !== 0) {
      new Error(`All endpoint must be implemented`);
    }

    return pipe(
      server,
      toExpress(options),
      Effect.flatMap((express) => pipe(express, listenExpress(options))),
    );
  };

/** @internal */
export const listenExpress =
  (options?: Partial<ListenOptions>) =>
  (express: express.Express): Effect.Effect<never, unknown, void> => {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    return pipe(
      Effect.acquireRelease(
        Effect.async<never, Error, http.Server>((cb) => {
          const server = express.listen(finalOptions.port);

          server.on("listening", () => {
            const address = server.address();

            if (address === null) {
              cb(Effect.fail(new Error("Could not obtain an address")));
            } else if (typeof address === "string") {
              cb(
                Effect.fail(
                  new Error(`Unexpected obtained address: ${address}`),
                ),
              );
            } else {
              cb(Effect.succeed(server));
            }
          });
          server.on("error", (error) => cb(Effect.fail(error)));
        }),
        (server) =>
          Effect.async<never, never, void>((cb) => {
            server.close((error) => {
              if (error === undefined) {
                cb(Effect.unit());
              } else {
                cb(Effect.logWarning("Server already closed"));
              }
            });
          }),
      ),
      Effect.tap((server) => {
        const address = server.address() as AddressInfo;
        return Effect.logInfo(
          `Server listening on ${address.address}:${address.port}`,
        );
      }),
      Effect.tap((server) => {
        if (options?.onStart) {
          return options?.onStart(server);
        }

        return Effect.unit();
      }),
      Effect.bindTo("app"),
      Effect.bind("scope", () => Scope.make()),
      Effect.flatMap(({ app }) =>
        Effect.async<never, never, string>((cb) => {
          const processSignals = ["SIGINT", "SIGTERM", "exit"];

          for (const signal of processSignals) {
            process.on(signal, () => {
              cb(Effect.succeed(signal));
            });
          }

          app.on("close", () => {
            cb(Effect.succeed("closed"));
          });
        }),
      ),
      Effect.flatMap((reason) =>
        Effect.logDebug(`Stopping server (${reason})`),
      ),
      Effect.scoped,
      Effect.provideSomeLayer(
        Logger.replace(
          Logger.defaultLogger,
          getLoggerFromOptions(finalOptions.logger),
        ),
      ),
    );
  };
