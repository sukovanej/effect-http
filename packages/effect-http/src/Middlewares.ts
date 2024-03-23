/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import type * as Effect from "effect/Effect"

import type * as HttpServer from "@effect/platform/HttpServer"
import * as internal from "./internal/middlewares.js"
import type * as ServerError from "./ServerError.js"

/**
 * Add access logs for handled requests. The log runs before each request.
 * Optionally configure log level using the first argument. The default log level
 * is `Debug`.
 *
 * @category logging
 * @since 1.0.0
 */
export const accessLog: (
  level?: "Info" | "Warning" | "Debug"
) => <R, E>(app: HttpServer.app.Default<R, E>) => HttpServer.app.Default<R, E> = internal.accessLog

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
  logAnnotationKey?: string
) => <R, E>(app: HttpServer.app.Default<R, E>) => HttpServer.app.Default<R, E> = internal.uuidLogAnnotation

/**
 * Measure how many times each endpoint was called in a
 * `server.endpoint_calls` counter metrics.
 *
 * @category metrics
 * @since 1.0.0
 */
export const endpointCallsMetric: () => <R, E>(
  app: HttpServer.app.Default<R, E>
) => HttpServer.app.Default<R, E> = internal.endpointCallsMetric

/**
 * Logs out a handler failure.
 *
 * @category logging
 * @since 1.0.0
 */
export const errorLog: <R, E>(app: HttpServer.app.Default<R, E>) => HttpServer.app.Default<R, E> = internal.errorLog

/**
 * @category models
 * @since 1.0.0
 */
export interface BasicAuthCredentials {
  user: string
  password: string
}

/**
 * Basic auth middleware.
 *
 * @category authorization
 * @since 1.0.0
 */
export const basicAuth: <R2, _>(
  checkCredentials: (
    credentials: BasicAuthCredentials
  ) => Effect.Effect<_, ServerError.ServerError, R2>,
  options?: Partial<{
    headerName: string
    skipPaths: ReadonlyArray<string>
  }>
) => <R1, E>(app: HttpServer.app.Default<R1, E>) => HttpServer.app.Default<R1 | R2, E> = internal.basicAuth

/**
 * @category models
 * @since 1.0.0
 */
export interface CorsOptions {
  allowedOrigins: ReadonlyArray<string>
  allowedMethods: ReadonlyArray<string>
  allowedHeaders: ReadonlyArray<string>
  exposedHeaders: ReadonlyArray<string>
  maxAge: number
  credentials: boolean
}

/**
 * Basic auth middleware.
 *
 * @category authorization
 * @since 1.0.0
 */
export const cors: (
  options?: Partial<CorsOptions>
) => <R, E>(app: HttpServer.app.Default<R, E>) => HttpServer.app.Default<R, E> = internal.cors
