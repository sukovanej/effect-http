/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import * as crypto from "crypto";

import * as Middleware from "@effect/platform/Http/Middleware";
import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import {
  Effect,
  Either,
  FiberRef,
  HashMap,
  Metric,
  identity,
  pipe,
} from "effect";
import { ServerError } from "effect-http";

/**
 * Add access logs for handled requests. The log runs before each request.
 * Optionally configure log level using the first argument. The default log level
 * is `Debug`.
 *
 * @category extensions
 * @since 1.0.0
 */
export const accessLogExtension = (
  level: "Info" | "Warning" | "Debug" = "Info",
) =>
  Middleware.make((app) =>
    pipe(
      ServerRequest.ServerRequest,
      Effect.flatMap((request) =>
        Effect[`log${level}`](`${request.method} ${request.url}`),
      ),
      Effect.flatMap(() => app),
    ),
  );

/**
 * Annotate request logs using generated UUID. The default annotation key is `requestId`.
 * The annotation key is configurable using the first argument.
 *
 * Note that in order to apply the annotation also for access logging, you should
 * make sure the `access-log` extension run after the `uuid-log-annotation`. Try
 * using `Http.prependExtension(Http.uuidLogAnnotationExtension())` if you don't
 * see the `requestId` log annotation in your access logs.
 *
 * @category extensions
 * @since 1.0.0
 */
export const uuidLogAnnotationExtension = (logAnnotationKey = "requestId") =>
  Middleware.make((app) =>
    pipe(
      Effect.sync(() => crypto.randomUUID()),
      Effect.flatMap((uuid) =>
        FiberRef.update(
          FiberRef.currentLogAnnotations,
          HashMap.set<string, unknown>(logAnnotationKey, uuid),
        ),
      ),
      Effect.flatMap(() => app),
    ),
  );

/**
 * Measure how many times each endpoint was called in a
 * `server.endpoint_calls` counter metrics.
 *
 * @category extensions
 * @since 1.0.0
 */
export const endpointCallsMetricExtension = () => {
  const endpointCalledCounter = Metric.counter("server.endpoint_calls");

  return Middleware.make((app) =>
    Effect.gen(function* (_) {
      const request = yield* _(ServerRequest.ServerRequest);
      const url = new URL(request.url);

      yield* _(
        Metric.increment(endpointCalledCounter),
        Effect.tagMetrics("path", url.pathname),
      );

      return yield* _(app);
    }),
  );
};

/**
 * Logs out a handler failure.
 *
 * @category extensions
 * @since 1.0.0
 */
export const errorLogExtension = () =>
  Middleware.make((app) =>
    Effect.gen(function* (_) {
      const request = yield* _(ServerRequest.ServerRequest);
      const path = new URL(request.url).pathname;

      return yield* _(
        app,
        Effect.tapError((error) =>
          pipe(
            Effect.logError(`${request.method.toUpperCase()} ${path} failed`),
            ServerError.isServerError(error)
              ? (eff) =>
                  Effect.annotateLogs(eff, {
                    errorTag: error._tag,
                    error: error.json || error.message,
                  })
              : identity,
          ),
        ),
      );
    }),
  );

/**
 * @category basic auth extension
 * @since 1.0.0
 */
export interface BasicAuthCredentials {
  user: string;
  password: string;
}

/**
 * Basic auth middleware.
 *
 * @category basic auth
 * @since 1.0.0
 */
export const basicAuth = <R, _>(
  checkCredentials: (
    credentials: BasicAuthCredentials,
  ) => Effect.Effect<R, ServerError.ServerError, _>,
  options?: Partial<{
    headerName: string;
    skipPaths: readonly string[];
  }>,
) =>
  Middleware.make((app) =>
    Effect.gen(function* (_) {
      const headerName = options?.headerName ?? "Authorization";
      const skippedPaths = options?.skipPaths ?? [];
      const request = yield* _(ServerRequest.ServerRequest);

      if (skippedPaths.includes(request.url)) {
        return yield* _(app);
      }

      const authHeader = request.headers[headerName.toLowerCase()];

      if (authHeader === undefined) {
        return ServerError.unauthorizedError(
          `Expected header ${headerName}`,
        ).toServerResponse();
      }

      const authorizationParts = authHeader.split(" ");

      if (authorizationParts.length !== 2) {
        return ServerError.unauthorizedError(
          'Incorrect auhorization scheme. Expected "Basic <credentials>"',
        ).toServerResponse();
      }

      if (authorizationParts[0] !== "Basic") {
        return ServerError.unauthorizedError(
          `Incorrect auhorization type. Expected "Basic", got "${authorizationParts[0]}"`,
        ).toServerResponse();
      }

      const credentialsBuffer = Buffer.from(authorizationParts[1], "base64");
      const credentialsText = credentialsBuffer.toString("utf-8");
      const credentialsParts = credentialsText.split(":");

      if (credentialsParts.length !== 2) {
        return ServerError.unauthorizedError(
          'Incorrect basic auth credentials format. Expected base64 encoded "<user>:<pass>".',
        ).toServerResponse();
      }

      const check = yield* _(
        checkCredentials({
          user: credentialsParts[0],
          password: credentialsParts[1],
        }),
        Effect.either,
      );

      if (Either.isLeft(check)) {
        return check.left.toServerResponse();
      }

      return yield* _(app);
    }),
  );
