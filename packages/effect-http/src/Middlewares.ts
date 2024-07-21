/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import type * as HttpApp from "@effect/platform/HttpApp"
import type * as LogLevel from "effect/LogLevel"

import * as internal from "./internal/middlewares.js"

/**
 * Add access logs for handled requests. The log runs before each request.
 * Optionally configure log level using the first argument. The default log level
 * is `Debug`.
 *
 * @category logging
 * @since 1.0.0
 */
export const accessLog: (
  level?: LogLevel.LogLevel
) => <R, E>(app: HttpApp.Default<E, R>) => HttpApp.Default<E, R> = internal.accessLog

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
) => <R, E>(app: HttpApp.Default<E, R>) => HttpApp.Default<E, R> = internal.uuidLogAnnotation

/**
 * Logs out a handler failure.
 *
 * @category logging
 * @since 1.0.0
 */
export const errorLog: <R, E>(app: HttpApp.Default<E, R>) => HttpApp.Default<E, R> = internal.errorLog
