import type * as Router from "@effect/platform/Http/Router"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import * as Unify from "effect/Unify"
import * as Api from "../Api.js"
import * as ServerError from "../ServerError.js"
import { formatParseError } from "./formatParseError.js"

interface ServerRequestParser {
  parseRequest: (
    request: ServerRequest.ServerRequest,
    context: Router.RouteContext
  ) => Effect.Effect<
    never,
    ServerError.ServerError,
    { query: any; params: any; body: any; headers: any }
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
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
): ServerRequestParser => {
  const parseBody = createBodyParser(endpoint, parseOptions)
  const parseQuery = createQueryParser(endpoint, parseOptions)
  const parseHeaders = createHeadersParser(endpoint, parseOptions)
  const parseParams = createParamsParser(endpoint, parseOptions)

  return make((request, context) =>
    Effect.all({
      body: parseBody(request),
      query: parseQuery(context),
      params: parseParams(context),
      headers: parseHeaders(request)
    })
  )
}

const createBodyParser = (
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
) => {
  const schema = endpoint.schemas.request.body

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.parse(schema)

  return Unify.unify((request: ServerRequest.ServerRequest) => {
    if (schema === Api.FormData) {
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
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
) => {
  const schema = endpoint.schemas.request.query

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.parse(schema)

  return (context: Router.RouteContext) => {
    return parse(context.searchParams, parseOptions).pipe(
      Effect.mapError((error) => createError("query", formatParseError(error, parseOptions)))
    )
  }
}

const createHeadersParser = (
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
) => {
  const schema = endpoint.schemas.request.headers

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.parse(schema)

  return (request: ServerRequest.ServerRequest) =>
    parse(request.headers, parseOptions).pipe(
      Effect.mapError((error) => createError("headers", formatParseError(error, parseOptions)))
    )
}

const createParamsParser = (
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
) => {
  const schema = endpoint.schemas.request.params

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.parse(schema)

  return (ctx: Router.RouteContext) =>
    parse(ctx.params, parseOptions).pipe(
      Effect.mapError((error) => createError("path", formatParseError(error, parseOptions)))
    )
}
