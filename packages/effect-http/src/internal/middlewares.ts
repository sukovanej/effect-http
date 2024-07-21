/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */

import * as HttpMiddleware from "@effect/platform/HttpMiddleware"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as Effect from "effect/Effect"
import * as FiberRef from "effect/FiberRef"
import { pipe } from "effect/Function"
import * as HashMap from "effect/HashMap"
import * as LogLevel from "effect/LogLevel"

/** @internal */
export const accessLog = (level: LogLevel.LogLevel = LogLevel.Info) =>
  HttpMiddleware.make((app) =>
    pipe(
      HttpServerRequest.HttpServerRequest,
      Effect.flatMap((request) => Effect.logWithLevel(level, `${request.method} ${request.url}`)),
      Effect.flatMap(() => app)
    )
  )

/** @internal */
export const uuidLogAnnotation = (logAnnotationKey = "requestId") =>
  HttpMiddleware.make((app) =>
    pipe(
      Effect.sync(() => crypto.randomUUID()),
      Effect.flatMap((uuid) =>
        FiberRef.update(
          FiberRef.currentLogAnnotations,
          HashMap.set<string, unknown>(logAnnotationKey, uuid)
        )
      ),
      Effect.flatMap(() => app)
    )
  )

/** @internal */
export const errorLog = HttpMiddleware.make((app) =>
  Effect.gen(function*(_) {
    const request = yield* _(HttpServerRequest.HttpServerRequest)

    const response = yield* _(app, Effect.tapErrorCause(Effect.logError))

    if (response.status >= 400 && response.status < 500) {
      yield* _(
        Effect.logWarning(
          `${request.method.toUpperCase()} ${request.url} client error ${response.status}`
        )
      )
    } else if (response.status >= 500) {
      yield* _(
        Effect.logError(
          `${request.method.toUpperCase()} ${request.url} server error ${response.status}`
        )
      )
    }

    return response
  })
)
