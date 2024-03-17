import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import { identity, pipe } from "effect/Function"
import * as HashSet from "effect/HashSet"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import * as ReadonlyRecord from "effect/ReadonlyRecord"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiSchema from "../ApiSchema.js"
import * as ClientError from "../ClientError.js"
import { formatParseError } from "./formatParseError.js"

interface ClientRequestEncoder {
  encodeRequest: (
    input: unknown,
    security: unknown
  ) => Effect.Effect<ClientRequest.ClientRequest, ClientError.ClientError>
}

const make = (
  encodeRequest: ClientRequestEncoder["encodeRequest"]
): ClientRequestEncoder => ({ encodeRequest })

export const create = (endpoint: ApiEndpoint.ApiEndpoint.Any): ClientRequestEncoder => {
  const encodeBody = createBodyEncoder(endpoint)
  const encodeQuery = createQueryEncoder(endpoint)
  const encodeHeaders = createHeadersEncoder(endpoint)
  const encodePath = createPathEncoder(endpoint)
  const encodeSecurity = createSecurityEncoder(endpoint)

  return make((input, security) =>
    Effect.gen(function*(_) {
      const _input = (input || {}) as Record<string, unknown>

      const body = yield* _(encodeBody(_input["body"]))
      const query = yield* _(encodeQuery(_input["query"]))
      const path = yield* _(encodePath(_input["path"]))
      const headers = yield* _(encodeHeaders(_input["headers"]))
      const headersWithSecurity = yield* _(encodeSecurity(headers || {}, security || {}))

      const finalPath = constructPath(path || {}, ApiEndpoint.getPath(endpoint))

      const request = pipe(
        ClientRequest.get(finalPath),
        ClientRequest.setMethod(ApiEndpoint.getMethod(endpoint)),
        body === undefined
          ? identity
          : body instanceof FormData
          ? ClientRequest.formDataBody(body)
          : ClientRequest.unsafeJsonBody(body),
        query ? ClientRequest.setUrlParams(query) : identity,
        headersWithSecurity ? ClientRequest.setHeaders(headersWithSecurity) : identity
      )

      return request
    })
  )
}

const ignoredSchemaEncoder = (name: string) => (input: unknown) => {
  if (input !== undefined) {
    return Effect.dieMessage(
      `Unexpected ${name} provided, got ${JSON.stringify(input)}`
    )
  }

  return Effect.succeed(undefined)
}

const createBodyEncoder = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const schema = ApiRequest.getBodySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return ignoredSchemaEncoder("body")
  }

  const encode = Schema.encode(schema as Schema.Schema<any, any, never>)

  return (body: unknown) => {
    return encode(body).pipe(
      Effect.mapError((error) =>
        ClientError.makeClientSide(
          error,
          `Failed to encode body. ${formatParseError(error)}`
        )
      )
    )
  }
}

const isRecordOrUndefined = (
  i: unknown
): i is Record<string | symbol, unknown> | undefined => Predicate.isRecord(i) || Predicate.isUndefined(i)

const createQueryEncoder = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const schema = ApiRequest.getQuerySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return ignoredSchemaEncoder("query")
  }

  const encode = Schema.encode(schema as Schema.Schema<any, any, never>)

  return (query: unknown) => {
    return encode(query).pipe(
      Effect.mapError((error) =>
        ClientError.makeClientSide(
          error,
          `Failed to encode query parameters. ${formatParseError(error)}`
        )
      )
    )
  }
}

const createHeadersEncoder = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const schema = ApiRequest.getHeadersSchema(ApiEndpoint.getRequest(endpoint))

  const encode = ApiSchema.isIgnored(schema) ? undefined : Schema.encode(schema as Schema.Schema<any, any, never>)

  return (headers: unknown) => {
    if (!isRecordOrUndefined(headers)) {
      return Effect.dieMessage("Headers must be a record")
    }

    return (encode ?? Effect.succeed)(headers).pipe(
      Effect.mapError((error) =>
        ClientError.makeClientSide(
          error,
          `Failed to encode headers. ${formatParseError(error)}`
        )
      )
    )
  }
}

const createSecurityEncoder = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const securitySpec = ApiEndpoint.getSecurity(endpoint)

  const securitySchemesSchemas = pipe(
    securitySpec,
    ReadonlyRecord.map((schema) => ({ schema, encode: Schema.encode(schema.schema) }))
  )

  return (headers: Record<string, string>, security: Record<string, any>) => {
    if (
      ReadonlyRecord.size(security) === 0 && ReadonlyRecord.size(securitySpec) !== 0
    ) {
      return Effect.fail(ClientError.makeClientSide(
        "Must provide at lest one secure scheme credential"
      ))
    }

    const requestEncodeSecuritySchemes = pipe(
      security,
      ReadonlyRecord.map((tokenToEncode, securityName) =>
        pipe(
          securitySchemesSchemas,
          ReadonlyRecord.get(securityName),
          Option.map((x) => ({ ...x, tokenToEncode }))
        )
      ),
      ReadonlyRecord.getSomes
    )

    if (
      pipe(
        requestEncodeSecuritySchemes,
        ReadonlyRecord.map(({ schema }) => schema.type),
        ReadonlyRecord.values,
        HashSet.fromIterable,
        HashSet.size
      ) !== ReadonlyRecord.size(requestEncodeSecuritySchemes)
    ) {
      return Effect.fail(ClientError.makeClientSide(
        "Failed to encode several security schemes with same type"
      ))
    }

    return pipe(
      requestEncodeSecuritySchemes,
      ReadonlyRecord.map(({ encode, schema, tokenToEncode }) =>
        encode(tokenToEncode).pipe(Effect.map((encodedToken) => ({
          schema,
          encodedToken
        })))
      ),
      Effect.all,
      Effect.mapError((error) =>
        ClientError.makeClientSide(
          error,
          `Failed to encode security token. ${formatParseError(error)}`
        )
      ),
      Effect.map(ReadonlyRecord.reduce(headers, (acc, { encodedToken }) => ({
        ...acc,
        authorization: encodedToken
      })))
    )
  }
}

const createPathEncoder = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  const schema = ApiRequest.getPathSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return ignoredSchemaEncoder("path")
  }

  const encode = Schema.encode(schema as Schema.Schema<any, any, never>)

  return (params: unknown) => {
    return encode(params).pipe(
      Effect.mapError((error) =>
        ClientError.makeClientSide(
          error,
          `Failed to encode path parmeters, ${formatParseError(error)}.`
        )
      )
    )
  }
}

const constructPath = (
  params: Record<string, string> | undefined,
  path: string
) => {
  return Object.entries(params ?? {})
    .reduce(
      (path, [key, value]) => path.replace(new RegExp(`(:${key})(\\?)?`), value),
      path
    )
    .replace(/\/:(\w+)(\?)?/, "")
}
