import type * as Router from "@effect/platform/Http/Router"
import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import * as Unify from "effect/Unify"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiSchema from "../ApiSchema.js"
import * as Security from "../Security.js"
import * as ServerError from "../ServerError.js"
import { formatParseError } from "./formatParseError.js"

interface ServerRequestParser {
  parseRequest: (
    request: ServerRequest.ServerRequest,
    context: Router.RouteContext
  ) => Effect.Effect<{ query: any; path: any; body: any; headers: any; security: any }, ServerError.ServerError>
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
): ServerRequestParser => {
  const parseBody = createBodyParser(endpoint, parseOptions)
  const parseQuery = createQueryParser(endpoint, parseOptions)
  const parseHeaders = createHeadersParser(endpoint, parseOptions)
  const parseParams = createParamsParser(endpoint, parseOptions)
  const parseSecurity = createSecurityParser(endpoint)

  return make((request, context) =>
    Effect.all({
      body: parseBody(request),
      query: parseQuery(context),
      path: parseParams(context),
      headers: parseHeaders(request),
      security: parseSecurity(request)
    }) as any
  )
}

const createBodyParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getBodySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return Unify.unify((request: ServerRequest.ServerRequest) => {
    if (schema === ApiSchema.FormData) {
      // TODO
      return Effect.succeed(undefined)
    }

    return request.json.pipe(
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
  })
}

const createQueryParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getQuerySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (context: Router.RouteContext) => {
    return parse(context.searchParams, parseOptions).pipe(
      Effect.mapError((error) => createError("query", formatParseError(error, parseOptions)))
    )
  }
}

const createHeadersParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getHeadersSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (request: ServerRequest.ServerRequest) =>
    parse(request.headers, parseOptions).pipe(
      Effect.mapError((error) => createError("headers", formatParseError(error, parseOptions)))
    )
}

const createSecurityParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
) => {
  const security = ApiEndpoint.getSecurity(endpoint)

  return (request: ServerRequest.ServerRequest) =>
    Security.handleRequest(security).pipe(
      Effect.provideService(ServerRequest.ServerRequest, request),
      Effect.mapError((e) => {
        if (Security.isSecurityError(e)) {
          return ServerError.makeJson(401, { error: "Unauthorized", message: e.message })
        }

        return e
      })
    )
}

const createParamsParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getPathSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (ctx: Router.RouteContext) =>
    parse(ctx.params, parseOptions).pipe(
      Effect.mapError((error) => createError("path", formatParseError(error, parseOptions)))
    )
}
