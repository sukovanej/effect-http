import * as Router from "@effect/platform/Http/Router"
import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as Security from "effect-http-security/Security"
import * as Effect from "effect/Effect"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiSchema from "../ApiSchema.js"
import * as ServerError from "../ServerError.js"
import { formatParseError } from "./formatParseError.js"

interface ServerRequestParser {
  parseRequest: Effect.Effect<
    { query: any; path: any; body: any; headers: any; security: any },
    ServerError.ServerError,
    ServerRequest.ServerRequest | ServerRequest.ParsedSearchParams | Router.RouteContext
  >
}

const createError = (
  location: "query" | "path" | "body" | "headers",
  message: string
) =>
  ServerError.makeJson(400, {
    error: "Request validation error",
    location,
    message
  })

const make = (
  parseRequest: ServerRequestParser["parseRequest"]
): ServerRequestParser => ({ parseRequest })

export const create = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
): ServerRequestParser =>
  make(
    Effect.all({
      body: parseBody(endpoint, parseOptions),
      query: parseQuery(endpoint, parseOptions),
      path: parsePath(endpoint, parseOptions),
      headers: parseHeaders(endpoint, parseOptions),
      security: parseSecurity(endpoint)
    }) as any
  )

const parseBody = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getBodySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  if (schema === ApiSchema.FormData) {
    // TODO
    return Effect.succeed(undefined)
  }

  return ServerRequest.ServerRequest.pipe(
    Effect.flatMap((request) => request.json),
    Effect.mapError((error) => {
      if (error.reason === "Transport") {
        return createError("body", "Unexpect request JSON body error")
      }

      return createError("body", "Invalid JSON")
    }),
    Effect.flatMap((request) =>
      parse(request, parseOptions).pipe(
        Effect.mapError((error) => createError("body", formatParseError(error, parseOptions)))
      )
    )
  )
}

const parseQuery = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getQuerySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  return Effect.mapError(
    ServerRequest.schemaSearchParams(schema, parseOptions),
    (error) => createError("query", formatParseError(error, parseOptions))
  )
}

const parseHeaders = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getHeadersSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return ServerRequest.ServerRequest.pipe(
    Effect.flatMap((request) => parse(request.headers, parseOptions)),
    Effect.mapError((error) => createError("headers", formatParseError(error, parseOptions)))
  )
}

const parseSecurity = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
) => {
  const security = ApiEndpoint.getSecurity(endpoint)

  return Security.handleRequest(security)
}

const parsePath = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getPathSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return Router.RouteContext.pipe(
    Effect.flatMap((ctx) => parse(ctx.params, parseOptions)),
    Effect.mapError((error) => createError("path", formatParseError(error, parseOptions)))
  )
}
