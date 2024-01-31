import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import { identity, pipe } from "effect/Function"
import * as HashSet from "effect/HashSet"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import * as ReadonlyRecord from "effect/ReadonlyRecord"
import * as Api from "../Api.js"
import * as ClientError from "../ClientError.js"
import { formatParseError } from "./formatParseError.js"
import * as utils from "./utils.js"

interface ClientRequestEncoder {
  encodeRequest: (
    input: unknown,
    security: Record<string, any> // | unknown
  ) => Effect.Effect<ClientRequest.ClientRequest, ClientError.ClientError>
}

const make = (
  encodeRequest: ClientRequestEncoder["encodeRequest"]
): ClientRequestEncoder => ({ encodeRequest })

export const create = (endpoint: Api.Endpoint): ClientRequestEncoder => {
  const encodeBody = createBodyEncoder(endpoint)
  const encodeQuery = createQueryEncoder(endpoint)
  const encodeHeaders = createHeadersEncoder(endpoint)
  const encodeParams = createParamsEncoder(endpoint)
  const encodeSecurity = createSecurityEncoder(endpoint)

  return make((input, security) =>
    Effect.gen(function*(_) {
      const _input = (input || {}) as Record<string, unknown>

      const body = yield* _(encodeBody(_input["body"]))
      const query = yield* _(encodeQuery(_input["query"]))
      const params = yield* _(encodeParams(_input["params"]))
      const headers = yield* _(encodeHeaders(_input["headers"]))
      const headersWithSecurity: any = yield* _(encodeSecurity(headers || {}, security || {}))

      const path = constructPath(params || {}, endpoint.path)

      const request = pipe(
        ClientRequest.get(path),
        ClientRequest.setMethod(utils.convertMethod(endpoint.method)),
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

const createBodyEncoder = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.body

  if (schema == Api.IgnoredSchemaId) {
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

const createQueryEncoder = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.query

  if (schema == Api.IgnoredSchemaId) {
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

const createHeadersEncoder = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.headers

  const encode = schema == Api.IgnoredSchemaId ? undefined : Schema.encode(schema as Schema.Schema<any, any, never>)

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
const createSecurityEncoder = (endpoint: Api.Endpoint) => {
  const securitySchemesSchemas = pipe(
    endpoint.security,
    ReadonlyRecord.map((schema) => ({
      schema,
      encode: Schema.encode(schema.decodeSchema as Schema.Schema<never, string, any>)
    }))
  )

  return (headers: Record<string, string>, security: Record<string, any>) => {
    if (
      (ReadonlyRecord.size(security) === 0) && (ReadonlyRecord.size(endpoint.security) !== 0)
    ) {
      return Effect.fail(ClientError.makeClientSide(
        "Must provide at lest on secure scheme credential"
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
        ReadonlyRecord.map((x) => x.schema.type),
        ReadonlyRecord.values,
        (x) => HashSet.make(...x),
        HashSet.size
      ) !== ReadonlyRecord.size(requestEncodeSecuritySchemes)
    ) {
      return Effect.fail(ClientError.makeClientSide(
        "Failed to encode several security schemes with same type"
      ))
    }

    return pipe(
      requestEncodeSecuritySchemes,
      ReadonlyRecord.map((x) =>
        x.encode(x.tokenToEncode).pipe(Effect.map((encodedToken) => ({
          schema: x.schema,
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
      Effect.map(ReadonlyRecord.reduce(headers, (acc, x) => ({
        ...acc,
        authorization: x.encodedToken
      })))
    )
  }
}

const createParamsEncoder = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.params

  if (schema == Api.IgnoredSchemaId) {
    return ignoredSchemaEncoder("params")
  }

  const encode = Schema.encode(schema as Schema.Schema<any, any, never>)

  return (params: unknown) => {
    return encode(params).pipe(
      Effect.mapError((error) =>
        ClientError.makeClientSide(
          error,
          `Failed to encode path parmeters. ${formatParseError(error)}`
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
