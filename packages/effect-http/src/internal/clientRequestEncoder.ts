import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import { identity, pipe } from "effect/Function"
import * as Predicate from "effect/Predicate"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiSchema from "../ApiSchema.js"
import * as ClientError from "../ClientError.js"
import { formatParseError } from "./formatParseError.js"

/** @internal */
interface ClientRequestEncoder {
  encodeRequest: (
    input: unknown
  ) => Effect.Effect<ClientRequest.ClientRequest, ClientError.ClientError>
}

/** @internal */
const make = (
  encodeRequest: ClientRequestEncoder["encodeRequest"]
): ClientRequestEncoder => ({ encodeRequest })

/** @internal */
export const create = (endpoint: ApiEndpoint.ApiEndpoint.Any): ClientRequestEncoder => {
  const encodeBody = createBodyEncoder(endpoint)
  const encodeQuery = createQueryEncoder(endpoint)
  const encodeHeaders = createHeadersEncoder(endpoint)
  const encodePath = createPathEncoder(endpoint)

  return make((input) =>
    Effect.gen(function*(_) {
      const _input = (input || {}) as Record<string, unknown>

      const body = yield* _(encodeBody(_input["body"]))
      const query = yield* _(encodeQuery(_input["query"]))
      const path = yield* _(encodePath(_input["path"]))
      const headers = yield* _(encodeHeaders(_input["headers"]))

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
        headers ? ClientRequest.setHeaders(headers) : identity
      )

      return request
    })
  )
}

/** @internal */
const ignoredSchemaEncoder = (name: string) => (input: unknown) => {
  if (input !== undefined) {
    return Effect.dieMessage(
      `Unexpected ${name} provided, got ${JSON.stringify(input)}`
    )
  }

  return Effect.succeed(undefined)
}

/** @internal */
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

/** @internal */
const isRecordOrUndefined = (
  i: unknown
): i is Record<string | symbol, unknown> | undefined => Predicate.isRecord(i) || Predicate.isUndefined(i)

/** @internal */
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

/** @internal */
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

/** @internal */
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

/** @internal */
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
