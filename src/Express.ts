/**
 * Functions in this module perform convertion of a `Server` instance onto
 * an `Express` application. Use the `listen` to create an express app and
 * start listening on the given port (3000 by default).
 *
 * @since 1.0.0
 */
import { once } from "events";
import type _express from "express";
import type http from "http";
import type { AddressInfo } from "net";
import { Readable } from "stream";

import { pipe } from "@effect/data/Function";
import { isError, isFunction, isString } from "@effect/data/Predicate";
import * as Effect from "@effect/io/Effect";
import * as Runtime from "@effect/io/Runtime";
import * as Scope from "@effect/io/Scope";
import { openApi } from "effect-http/OpenApi";
import { type ServerHandler, buildServer } from "effect-http/Server";
import type { ServerBuilder } from "effect-http/ServerBuilder";
import { internalServerError, notFoundError } from "effect-http/ServerError";

/**
 * @category models
 * @since 1.0.0
 */
export interface ExpressOptions {
  /** Controls whether to expose OpenAPI UI or not. */
  openapiEnabled: boolean;

  /** Which path should be the OpenAPI UI exposed on. */
  openapiPath: string;
}

/**
 * Create express app from the `Server`
 *
 * @category combinators
 * @since 1.0.0
 */
export const express =
  (options?: Partial<ExpressOptions>) =>
  <R>(
    serverBuilder: ServerBuilder<R, []>,
  ): Effect.Effect<R, unknown, _express.Express> => {
    const server = buildServer(serverBuilder);
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    return pipe(
      Effect.gen(function* ($) {
        const runtime = yield* $(Effect.runtime<R>());

        const _express = yield* $(Effect.promise(() => import("express")));

        const app = _express.default();

        for (const handler of server.handlers) {
          const method = handler.endpoint.method;
          const path = handler.endpoint.path;
          const endpoint = toEndpoint(handler, runtime);
          const router = _express.Router()[method](path, endpoint);
          app.use(router);
        }

        const swaggerUi = yield* $(
          Effect.promise(() => import("swagger-ui-express")),
        );

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
          return Effect.logDebug(
            `Server loaded with extensions: ${extensions}`,
          );
        } else {
          return Effect.logDebug("Server loaded without extensions");
        }
      }),
    );
  };

/**
 * @category models
 * @since 1.0.0
 */
export interface ListenOptions extends ExpressOptions {
  /** Port to listen on
   *
   *  By default, any available port will be used.
   *
   *  @default undefined
   */
  port: number | undefined;

  /** Run effect after server starts. */
  onStart?: (server: http.Server) => Effect.Effect<never, any, any>;
}

/**
 * Create an express app from the `Server` and start the server
 *
 * @category combinators
 * @since 1.0.0
 */
export const listen =
  (options?: Partial<ListenOptions>) =>
  <R>(serverBuilder: ServerBuilder<R, []>): Effect.Effect<R, unknown, void> => {
    return pipe(
      serverBuilder,
      express(options),
      Effect.flatMap((express) => pipe(express, listenExpress(options))),
    );
  };

/**
 * Start the server from an express app
 *
 * @category combinators
 * @since 1.0.0
 */
export const listenExpress =
  (options?: Partial<ListenOptions>) =>
  (express: _express.Express): Effect.Effect<never, unknown, void> => {
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
                cb(Effect.logWarning("Server already closed"));
              }
            });
          }),
      ),
      Effect.tap(([server]) => {
        const address = server.address() as AddressInfo;
        return Effect.logInfo(
          `Server listening on ${address.address}:${address.port}`,
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
        Effect.logDebug(`Stopping server (${reason})`),
      ),
      Effect.scoped,
    );
  };

/** @internal */
export const DEFAULT_OPTIONS = {
  openapiEnabled: true,
  openapiPath: "/docs",
} satisfies ExpressOptions;

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
const toEndpoint = (handler: ServerHandler, runtime: Runtime.Runtime<any>) => {
  const hanleFn = handler.fn;
  return (req: _express.Request, res: _express.Response) => {
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
          Effect.logFatal("Defect occured when sending failure response"),
          Effect.annotateLogs("error", errorToLog(error)),
        ),
      ),
      Runtime.runPromise(runtime),
    );
  };
};
