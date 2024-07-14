/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */

import * as Headers from "@effect/platform/Headers"
import * as HttpMiddleware from "@effect/platform/HttpMiddleware"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Encoding from "effect/Encoding"
import * as FiberRef from "effect/FiberRef"
import { pipe } from "effect/Function"
import * as HashMap from "effect/HashMap"
import * as Metric from "effect/Metric"

import * as HttpError from "../HttpError.js"
import type * as Middlewares from "../Middlewares.js"

/** @internal */
export const accessLog = (level: "Info" | "Warning" | "Debug" = "Info") =>
  HttpMiddleware.make((app) =>
    pipe(
      HttpServerRequest.HttpServerRequest,
      Effect.flatMap((request) => Effect[`log${level}`](`${request.method} ${request.url}`)),
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
export const endpointCallsMetric = () => {
  const endpointCalledCounter = Metric.counter("server.endpoint_calls")

  return HttpMiddleware.make((app) =>
    Effect.gen(function*(_) {
      const request = yield* _(HttpServerRequest.HttpServerRequest)

      yield* _(
        Metric.increment(endpointCalledCounter),
        Effect.tagMetrics("path", request.url)
      )

      return yield* _(app)
    })
  )
}

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

/** @internal */
export const basicAuth = <R, _>(
  checkCredentials: (
    credentials: Middlewares.BasicAuthCredentials
  ) => Effect.Effect<_, HttpError.HttpError, R>,
  options?: Partial<{
    headerName: string
    skipPaths: ReadonlyArray<string>
  }>
) =>
  HttpMiddleware.make((app) =>
    Effect.gen(function*(_) {
      const headerName = options?.headerName ?? "Authorization"
      const skippedPaths = options?.skipPaths ?? []
      const request = yield* _(HttpServerRequest.HttpServerRequest)

      if (skippedPaths.includes(request.url)) {
        return yield* _(app)
      }

      const authHeader = request.headers[headerName.toLowerCase()]

      if (authHeader === undefined) {
        return HttpError.unauthorized(
          `Expected header ${headerName}`
        ).pipe(HttpError.toResponse)
      }

      const authorizationParts = authHeader.split(" ")

      if (authorizationParts.length !== 2) {
        return HttpError.unauthorized(
          "Incorrect auhorization scheme. Expected \"Basic <credentials>\""
        ).pipe(HttpError.toResponse)
      }

      if (authorizationParts[0] !== "Basic") {
        return HttpError.unauthorized(
          `Incorrect auhorization type. Expected "Basic", got "${authorizationParts[0]}"`
        ).pipe(HttpError.toResponse)
      }

      const credentialsDecoded = Encoding.decodeBase64String(authorizationParts[1])

      if (Either.isLeft(credentialsDecoded)) {
        return HttpError.unauthorized("Invalid base64 encoding").pipe(HttpError.toResponse)
      }

      const credentialsText = credentialsDecoded.right
      const credentialsParts = credentialsText.split(":")

      if (credentialsParts.length !== 2) {
        return HttpError.unauthorized(
          "Incorrect basic auth credentials format. Expected base64 encoded \"<user>:<pass>\"."
        ).pipe(HttpError.toResponse)
      }

      const check = yield* _(
        checkCredentials({
          user: credentialsParts[0],
          password: credentialsParts[1]
        }),
        Effect.either
      )

      if (Either.isLeft(check)) {
        return HttpError.toResponse(check.left)
      }

      return yield* _(app)
    })
  )

/** @internal */
export const cors = (_options?: Partial<Middlewares.CorsOptions>) => {
  const DEFAULTS = {
    allowedOrigins: ["*"],
    allowedMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: [],
    exposedHeaders: [],
    credentials: false
  } as const

  const options = { ...DEFAULTS, ..._options }

  const isAllowedOrigin = (origin: string) => {
    return options.allowedOrigins.includes(origin)
  }

  const allowOrigin = (originHeader: string) => {
    if (options.allowedOrigins.length === 0) {
      return { "Access-Control-Allow-Origin": "*" }
    }

    if (options.allowedOrigins.length === 1) {
      return {
        "Access-Control-Allow-Origin": options.allowedOrigins[0],
        Vary: "Origin"
      }
    }

    if (isAllowedOrigin(originHeader)) {
      return {
        "Access-Control-Allow-Origin": originHeader,
        Vary: "Origin"
      }
    }

    return undefined
  }

  const allowMethods = (() => {
    if (options.allowedMethods.length > 0) {
      return {
        "Access-Control-Allow-Methods": options.allowedMethods.join(", ")
      }
    }

    return undefined
  })()

  const allowCredentials = (() => {
    if (options.credentials) {
      return { "Access-Control-Allow-Credentials": "true" }
    }

    return undefined
  })()

  const allowHeaders = (accessControlRequestHeaders: string | undefined) => {
    if (options.allowedHeaders.length === 0 && accessControlRequestHeaders) {
      return {
        Vary: "Access-Control-Request-Headers",
        "Access-Control-Allow-Headers": accessControlRequestHeaders
      }
    }

    if (options.allowedHeaders) {
      return {
        "Access-Control-Allow-Headers": options.allowedHeaders.join(",")
      }
    }

    return undefined
  }

  const exposeHeaders = (() => {
    if (options.exposedHeaders.length > 0) {
      return {
        "Access-Control-Expose-Headers": options.exposedHeaders.join(",")
      }
    }

    return undefined
  })()

  const maxAge = (() => {
    if (options.maxAge) {
      return { "Access-Control-Max-Age": options.maxAge.toString() }
    }

    return undefined
  })()

  return HttpMiddleware.make((app) =>
    Effect.gen(function*(_) {
      const request = yield* _(HttpServerRequest.HttpServerRequest)

      const origin = request.headers["origin"]
      const accessControlRequestHeaders = request.headers["access-control-request-headers"]

      let corsHeaders = {
        ...allowOrigin(origin),
        ...allowCredentials,
        ...exposeHeaders
      }

      if (request.method === "OPTIONS") {
        corsHeaders = {
          ...corsHeaders,
          ...allowMethods,
          ...allowHeaders(accessControlRequestHeaders),
          ...maxAge
        }

        return HttpServerResponse.empty({
          status: 204,
          headers: Headers.fromInput(corsHeaders)
        })
      }

      const response = yield* _(app)

      return response.pipe(HttpServerResponse.setHeaders(corsHeaders))
    })
  )
}
