import * as Log from "effect-log";
import { once } from "events";
import express from "express";
import http from "http";
import type { AddressInfo } from "net";
import { Readable } from "stream";
import swaggerUi from "swagger-ui-express";

import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import {
  isError,
  isFunction,
  isRecord,
  isString,
} from "@effect/data/Predicate";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as Runtime from "@effect/io/Runtime";
import * as Scope from "@effect/io/Scope";

import type { Endpoint } from "effect-http/Api";
import type { ExpressOptions, ListenOptions } from "effect-http/Express";
import type {
  AfterHandlerExtension,
  BeforeHandlerExtension,
  OnErrorExtension,
} from "effect-http/Extensions";
import { openApi } from "effect-http/OpenApi";
import type { Handler, Server, ServerExtension } from "effect-http/Server";
import {
  API_STATUS_CODES,
  internalServerError,
  isApiError,
  isConflictError,
  isInvalidBodyError,
  isInvalidHeadersError,
  isInvalidParamsError,
  isInvalidQueryError,
  isInvalidResponseError,
  notFoundError,
} from "effect-http/ServerError";
import {
  formatValidationError,
  isParseError,
} from "effect-http/ValidationErrorFormatter";

/** @internal */
const errorToLog = (error: unknown): string => {
  if (isError(error)) {
    return error.stack || error.message;
  }

  if (["string", "number", "boolean"].includes(typeof error)) {
    return `${error}`;
  }

  return JSON.stringify(error);
};

/** @internal */
const formatError = (error: unknown) => {
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
      return formatValidationError(innerError);
    } else if (isString(innerError)) {
      return Effect.succeed(innerError);
    }
  }

  if (isRecord(error) && "error" in error) {
    if (isString(error.error)) {
      return Effect.succeed(error.error);
    }

    return Effect.succeed(JSON.stringify(error.error));
  }

  return Effect.succeed(JSON.stringify(error));
};

/** @internal */
export const convertErrorToResponse = (error: unknown) =>
  Effect.map(formatError(error), (details) => {
    const tag = isApiError(error) ? error._tag : "InternalServerError";
    const body = JSON.stringify({ error: tag, details });

    return new Response(body, {
      status: Object.keys(API_STATUS_CODES).includes(tag)
        ? API_STATUS_CODES[tag as keyof typeof API_STATUS_CODES]
        : 500,
      headers: new Headers({ "Content-Type": "application/json" }),
    });
  });

export const runHandlerFnWithExtensions = (
  allExtensions: ServerExtension<any, Endpoint[]>[],
  { fn, endpoint }: Handler,
) => {
  const extensions = allExtensions
    .filter(
      ({ options }) =>
        options.allowOperations.includes(endpoint.id) ||
        !options.skipOperations.includes(endpoint.id),
    )
    .map(({ extension }) => extension);

  const beforeExtensions = extensions.filter(
    (h): h is BeforeHandlerExtension<any> =>
      h._tag === "BeforeHandlerExtension",
  );
  const afterExtensions = extensions.filter(
    (h): h is AfterHandlerExtension<any> => h._tag === "AfterHandlerExtension",
  );
  const onErrorExtensions = extensions.filter(
    (h): h is OnErrorExtension<any> => h._tag === "OnErrorExtension",
  );

  return (request: Request) =>
    pipe(
      Effect.all(beforeExtensions.map(({ fn }) => fn(request))),
      Effect.either,
      Effect.flatMap(
        Either.match({
          onLeft: (error) => convertErrorToResponse(error),
          onRight: () =>
            pipe(
              fn(request),
              Effect.tapError((error) =>
                Effect.all(
                  onErrorExtensions.map(({ fn }) => fn(request, error)),
                ),
              ),
              Effect.tap((response) =>
                Effect.all(
                  afterExtensions.map(({ fn }) => fn(request, response)),
                ),
              ),
              Effect.catchAll((error) => convertErrorToResponse(error)),
            ),
        }),
      ),
    );
};

/** @internal */
const toEndpoint = (
  extensions: ServerExtension<any, Endpoint[]>[],
  handler: Handler,
  runtime: Runtime.Runtime<any>,
) => {
  const hanleFn = runHandlerFnWithExtensions(extensions, handler);
  return (req: express.Request, res: express.Response) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    Object.entries(req.query).forEach(([name, value]) =>
      url.searchParams.set(name, value as string),
    );
    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : new ReadableStream({
          start(controller) {
            req.on("data", (chunk) => controller.enqueue(chunk));
            req.on("end", () => controller.close());
            req.on("error", (err) => controller.error(err));
          },
        });

    let headers = req.headers as any;

    if (headers[":method"]) {
      headers = Object.fromEntries(
        Object.entries(headers).filter(([key]) => !key.startsWith(":")),
      );
    }

    const request = new Request(url, {
      body,
      headers,
      method: req.method,
      // @ts-ignore
      duplex: "half",
    });

    return pipe(
      hanleFn(request),
      Effect.flatMap((response) =>
        pipe(
          Effect.tryPromise(async () => {
            Array.from(response.headers.entries()).forEach(([key, value]) => {
              res.setHeader(key, value);
            });

            const body: Readable | null =
              response.body instanceof Readable
                ? response.body
                : response.body instanceof ReadableStream &&
                  isFunction(Readable.fromWeb)
                ? Readable.fromWeb(response.body as any)
                : response.body
                ? Readable.from(response.body as any)
                : null;

            res.statusCode = response.status;

            if (body) {
              body.pipe(res, { end: true });
              return Promise.race([once(res, "finish"), once(res, "error")]);
            } else {
              res.setHeader("content-length", "0");
              res.end();
            }
          }),
          Effect.mapError(internalServerError),
        ),
      ),
      Effect.catchAllDefect((error) =>
        pipe(
          Effect.log("Defect occured when sending failure response", "Fatal"),
          Effect.annotateLogs("error", errorToLog(error)),
        ),
      ),
      Runtime.runPromise(runtime),
    );
  };
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

        for (const handler of server.handlers) {
          const method = handler.endpoint.method;
          const path = handler.endpoint.path;
          const endpoint = toEndpoint(server.extensions, handler, runtime);
          const router = express.Router()[method](path, endpoint);
          app.use(router);
        }

        if (finalOptions.openapiEnabled) {
          app.use(
            finalOptions.openapiPath,
            swaggerUi.serve,
            swaggerUi.setup(openApi(server.api)),
          );
        }

        // 404
        app.use((req, res) =>
          res.status(404).json(notFoundError(`No handler for ${req.path}`)),
        );

        return app;
      }),
      Effect.tap(() => {
        if (server.extensions.length > 0) {
          const extensions = server.extensions
            .map(({ extension }) => extension.id)
            .join(", ");
          return Effect.log(
            `Server loaded with extensions: ${extensions}`,
            "Debug",
          );
        } else {
          return Effect.log(`Server loaded without extensions`, "Debug");
        }
      }),
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
  logger: "pretty",
} satisfies ExpressOptions;

/** @internal */
const DEFAULT_LOGGERS = {
  default: Logger.defaultLogger,
  pretty: Log.pretty,
  json: Log.json(),
  none: Logger.none,
};

/** @internal */
const getLoggerFromOptions = (logger: ExpressOptions["logger"]) => {
  if (isString(logger)) {
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
        Effect.async<never, Error, [http.Server, (_: Error) => void]>((cb) => {
          const server = express.listen(finalOptions.port);

          const errorListener = (error: Error) => cb(Effect.fail(error));
          const listeningListener = () => {
            const address = server.address();

            if (address === null) {
              cb(Effect.fail(new Error("Could not obtain an address")));
            } else if (isString(address)) {
              cb(
                Effect.fail(
                  new Error(`Unexpected obtained address: ${address}`),
                ),
              );
            } else {
              cb(Effect.succeed([server, errorListener]));
            }
          };

          server.on("listening", listeningListener);
          server.on("error", errorListener);
        }),
        ([server, errorListener]) =>
          Effect.async<never, never, void>((cb) => {
            server.close((error) => {
              server.removeListener("error", errorListener);

              if (error === undefined) {
                cb(Effect.unit);
              } else {
                cb(Effect.log("Server already closed", "Warning"));
              }
            });
          }),
      ),
      Effect.tap(([server]) => {
        const address = server.address() as AddressInfo;
        return Effect.log(
          `Server listening on ${address.address}:${address.port}`,
          "Info",
        );
      }),
      Effect.tap(([server]) => {
        if (options?.onStart) {
          return options?.onStart(server);
        }

        return Effect.unit;
      }),
      Effect.map(([app]) => ({ app })),
      Effect.bind("scope", () => Scope.make()),
      Effect.flatMap(({ app }) =>
        Effect.async<never, never, string>((cb) => {
          const processSignals = ["SIGINT", "SIGTERM", "exit"];
          const listeners = processSignals.map(
            (signal) => [signal, () => cb(Effect.succeed(signal))] as const,
          );

          for (const [signal, listener] of listeners) {
            process.on(signal, listener);
          }

          app.on("close", () => {
            cb(Effect.succeed("closed"));
            listeners.forEach(([signal, listener]) =>
              process.removeListener(signal, listener),
            );
          });
        }),
      ),
      Effect.flatMap((reason) =>
        Effect.log(`Stopping server (${reason})`, "Debug"),
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
