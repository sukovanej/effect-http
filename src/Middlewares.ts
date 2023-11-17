/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import type * as App from "@effect/platform/Http/App";
import type * as ServerError from "effect-http/ServerError";
import * as internal from "effect-http/internal/middlewares";
import type * as Effect from "effect/Effect";

/**
 * Add access logs for handled requests. The log runs before each request.
 * Optionally configure log level using the first argument. The default log level
 * is `Debug`.
 *
 * @category logging
 * @since 1.0.0
 */
export const accessLog: (
  level?: "Info" | "Warning" | "Debug",
) => <R, E>(app: App.Default<R, E>) => App.Default<R, E> = internal.accessLog;

/**
 * Annotate request logs using generated UUID. The default annotation key is `requestId`.
 * The annotation key is configurable using the first argument.
 *
 * Note that in order to apply the annotation also for access logging, you should
 * make sure the `accessLog` middleware is plugged after the `uuidLogAnnotation`.
 *
 * @category logging
 * @since 1.0.0
 */
export const uuidLogAnnotation: (
  logAnnotationKey?: string,
) => <R, E>(app: App.Default<R, E>) => App.Default<R, E> =
  internal.uuidLogAnnotation;

/**
 * Measure how many times each endpoint was called in a
 * `server.endpoint_calls` counter metrics.
 *
 * @category metrics
 * @since 1.0.0
 */
export const endpointCallsMetric: () => <R, E>(
  app: App.Default<R, E>,
) => App.Default<R, E> = internal.endpointCallsMetric;

/**
 * Logs out a handler failure.
 *
 * @category logging
 * @since 1.0.0
 */
export const errorLog: <R, E>(app: App.Default<R, E>) => App.Default<R, E> =
  internal.errorLog;

/**
 * @category models
 * @since 1.0.0
 */
export interface BasicAuthCredentials {
  user: string;
  password: string;
}

/**
 * Basic auth middleware.
 *
 * @category authorization
 * @since 1.0.0
 */
export const basicAuth: <R2, _>(
  checkCredentials: (
    credentials: BasicAuthCredentials,
  ) => Effect.Effect<R2, ServerError.ServerError, _>,
  options?: Partial<{
    headerName: string;
    skipPaths: readonly string[];
  }>,
) => <R1, E>(app: App.Default<R1, E>) => App.Default<R1 | R2, E> =
  internal.basicAuth;

/**
 * @category models
 * @since 1.0.0
 */
export interface CorsOptions {
  allowedOrigins: string | readonly string[];
  allowAllOrigins: boolean;
}

/**
 * Basic auth middleware.
 *
 * @category authorization
 * @since 1.0.0
 */
export const cors: (
  options?: Partial<CorsOptions>,
) => <R, E>(app: App.Default<R, E>) => App.Default<R, E> = internal.cors;
