import type * as Router from "@effect/platform/Http/Router"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as ReadonlyRecord from "effect/ReadonlyRecord"
import * as Unify from "effect/Unify"
import * as Api from "../Api.js"
import * as ServerError from "../ServerError.js"
import { formatParseError } from "./formatParseError.js"

interface ServerRequestParser {
  parseRequest: (
    request: ServerRequest.ServerRequest,
    context: Router.RouteContext
  ) => Effect.Effect<{ query: any; params: any; body: any; headers: any; security: any }, ServerError.ServerError>
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
  const parseSecurity = createSecurityParser(endpoint, parseOptions)

  return make((request, context) =>
    Effect.all({
      body: parseBody(request),
      query: parseQuery(context),
      params: parseParams(context),
      headers: parseHeaders(request),
      security: parseSecurity(request)
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

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

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

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

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

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (request: ServerRequest.ServerRequest) =>
    parse(request.headers, parseOptions).pipe(
      Effect.mapError((error) => createError("headers", formatParseError(error, parseOptions)))
    )
}

const createSecurityParser = (
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
) => {
  const { security } = endpoint

  const securitySchemesWithDecode = pipe(
    security,
    ReadonlyRecord.map((securityScheme) => ({
      securityScheme,
      decodeEither: Schema.decodeUnknownEither(
        Schema.struct({ authorization: securityScheme.decodeSchema }) as Schema.Schema<any, unknown>,
        parseOptions
      )
    }))
  )

  return Effect.unifiedFn((request: ServerRequest.ServerRequest) => {
    const authResults = pipe(
      securitySchemesWithDecode,
      ReadonlyRecord.map(({ decodeEither, securityScheme }) => {
        return {
          token: decodeEither(request.headers).pipe(Either.map((x) => x.authorization)),
          securityScheme
        }
      })
    )

    if (ReadonlyRecord.size(authResults) === 0) {
      return Effect.succeed(authResults)
    }

    const hasRight = ReadonlyRecord.some(authResults, (authResult) => Either.isRight(authResult.token))

    if (hasRight) {
      return Effect.succeed(authResults)
    } else {
      return createError("headers", "Bad authorization header")
    }
  })
}

const createParamsParser = (
  endpoint: Api.Endpoint,
  parseOptions?: AST.ParseOptions
) => {
  const schema = endpoint.schemas.request.params

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (ctx: Router.RouteContext) =>
    parse(ctx.params, parseOptions).pipe(
      Effect.mapError((error) => createError("path", formatParseError(error, parseOptions)))
    )
}
