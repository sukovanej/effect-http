/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import * as crypto from "crypto";

import { identity, pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as Option from "@effect/data/Option";
import { isString } from "@effect/data/Predicate";
import * as Effect from "@effect/io/Effect";
import * as FiberRef from "@effect/io/FiberRef";
import * as Metric from "@effect/io/Metric";

import {
  type ApiError,
  isApiError,
  unauthorizedError,
} from "effect-http/ServerError";

/**
 * Effect running before handlers.
 *
 * @category models
 * @since 1.0.0
 */
export type BeforeHandlerExtension<R> = {
  _tag: "BeforeHandlerExtension";
  id: string;
  fn: (request: Request) => Effect.Effect<R, ApiError, unknown>;
};

/**
 * Effect running after handlers.
 *
 * @category models
 * @since 1.0.0
 */
export type AfterHandlerExtension<R> = {
  _tag: "AfterHandlerExtension";
  id: string;
  fn: (
    request: Request,
    response: Response,
  ) => Effect.Effect<R, ApiError, unknown>;
};

/**
 * Effect running after handlers.
 *
 * @category models
 * @since 1.0.0
 */
export type OnErrorExtension<R> = {
  _tag: "OnErrorExtension";
  id: string;
  fn: (request: Request, error: unknown) => Effect.Effect<R, unknown, unknown>;
};

/**
 * Effects applied for all requests. Safer variant of middlewares.
 *
 * @category models
 * @since 1.0.0
 */
export type Extension<R> =
  | BeforeHandlerExtension<R>
  | AfterHandlerExtension<R>
  | OnErrorExtension<R>;

/**
 * Create an extension which runs an effect before each endpoint handler.
 *
 * @category constructors
 * @since 1.0.0
 */
export const beforeHandlerExtension = <R>(
  id: string,
  fn: BeforeHandlerExtension<R>["fn"],
): BeforeHandlerExtension<R> => ({ _tag: "BeforeHandlerExtension", id, fn });

/**
 * Create an extension which runs an effect after each successful endpoint handler.
 *
 * @category constructors
 * @since 1.0.0
 */
export const afterHandlerExtension = <R>(
  id: string,
  fn: AfterHandlerExtension<R>["fn"],
): AfterHandlerExtension<R> => ({ _tag: "AfterHandlerExtension", id, fn });

/**
 * Create an extension which runs an effect when a handler fails.
 *
 * @category constructors
 * @since 1.0.0
 */
export const onHandlerErrorExtension = <R>(
  id: string,
  fn: OnErrorExtension<R>["fn"],
): OnErrorExtension<R> => ({ _tag: "OnErrorExtension", id, fn });

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
): BeforeHandlerExtension<never> =>
  beforeHandlerExtension("access-log", (request) =>
    Effect.log(`${request.method} ${request.url}`, level),
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
export const uuidLogAnnotationExtension = (
  logAnnotationKey = "requestId",
): BeforeHandlerExtension<never> =>
  beforeHandlerExtension("uuid-log-annotation", () =>
    pipe(
      Effect.sync(() => crypto.randomUUID()),
      Effect.flatMap((uuid) =>
        FiberRef.update(
          FiberRef.currentLogAnnotations,
          HashMap.set<string, string>(logAnnotationKey, uuid),
        ),
      ),
    ),
  );

/**
 * Measure how many times each endpoint was called in a
 * `server.endpoint_calls` counter metrics.
 *
 * @category extensions
 * @since 1.0.0
 */
export const endpointCallsMetricExtension =
  (): BeforeHandlerExtension<never> => {
    const endpointCalledCounter = Metric.counter("server.endpoint_calls");

    return beforeHandlerExtension("endpoint-calls-metric", (request) => {
      const url = new URL(request.url);

      return pipe(
        Metric.increment(endpointCalledCounter),
        Effect.tagMetrics("path", url.pathname),
      );
    });
  };

/**
 * Logs out a handler failure.
 *
 * @category extensions
 * @since 1.0.0
 */
export const errorLogExtension = () =>
  onHandlerErrorExtension("error-log", (request, error) => {
    const path = new URL(request.url).pathname;

    return pipe(
      Effect.log(`${request.method.toUpperCase()} ${path} failed`, "Error"),
      isApiError(error)
        ? (eff) =>
            pipe(
              eff,
              Effect.annotateLogs("errorTag", error._tag),
              Effect.annotateLogs(
                "error",
                isString(error.error)
                  ? error.error
                  : JSON.stringify(error.error),
              ),
            )
        : identity,
    );
  });

/**
 * @category basic auth extension
 * @since 1.0.0
 */
export type BasicAuthCredentials = {
  user: string;
  password: string;
};

/**
 *
 *
 * @category basic auth extension
 * @since 1.0.0
 */
export const basicAuthExtension = <R2, _>(
  checkCredentials: (
    credentials: BasicAuthCredentials,
  ) => Effect.Effect<R2, string, _>,
  headerName = "Authorization",
) =>
  beforeHandlerExtension("basic-auth", (request) =>
    pipe(
      Option.fromNullable(request.headers.get(headerName)),
      Effect.mapError(() => unauthorizedError(`Expected header ${headerName}`)),
      Effect.flatMap((authHeader) => {
        const authorizationParts = authHeader.split(" ");

        if (authorizationParts.length !== 2) {
          return Effect.fail(
            unauthorizedError(
              'Incorrect auhorization scheme. Expected "Basic <credentials>"',
            ),
          );
        }

        if (authorizationParts[0] !== "Basic") {
          return Effect.fail(
            unauthorizedError(
              `Incorrect auhorization type. Expected "Basic", got "${authorizationParts[0]}"`,
            ),
          );
        }

        const credentialsBuffer = Buffer.from(authorizationParts[1], "base64");
        const credentialsText = credentialsBuffer.toString("utf-8");
        const credentialsParts = credentialsText.split(":");

        if (credentialsParts.length !== 2) {
          return Effect.fail(
            unauthorizedError(
              'Incorrect basic auth credentials format. Expected base64 encoded "<user>:<pass>".',
            ),
          );
        }

        return Effect.succeed({
          user: credentialsParts[0],
          password: credentialsParts[1],
        });
      }),
      Effect.flatMap((credentials) =>
        Effect.mapError(checkCredentials(credentials), unauthorizedError),
      ),
    ),
  );
