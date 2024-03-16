import type * as ClientResponse from "@effect/platform/Http/ClientResponse"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import { flow, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Unify from "effect/Unify"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiResponse from "../ApiResponse.js"
import * as ApiSchema from "../ApiSchema.js"
import * as ClientError from "../ClientError.js"
import type * as Representation from "../Representation.js"

interface ClientResponseParser {
  parseResponse: (
    response: ClientResponse.ClientResponse
  ) => Effect.Effect<any, ClientError.ClientError>
}

const make = (
  parseResponse: ClientResponseParser["parseResponse"]
): ClientResponseParser => ({ parseResponse })

export const create = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
): ClientResponseParser => {
  const responses = ApiEndpoint.getResponse(endpoint)
  const isFullResponse = ApiEndpoint.isFullResponse(endpoint)
  const statusToSchema = responses.reduce(
    (obj, schemas) => ({ ...obj, [ApiResponse.getStatus(schemas)]: schemas }),
    {} as Record<number, ApiResponse.ApiResponse.Any>
  )

  return make((response) =>
    Effect.gen(function*(_) {
      yield* _(handleUnsucessful(response))

      if (!(response.status in statusToSchema)) {
        const allowedStatuses = Object.keys(statusToSchema)

        return yield* _(
          Effect.dieMessage(
            `Unexpected status ${response.status}. Allowed ones are ${allowedStatuses}.`
          )
        )
      }

      const responseSpec = statusToSchema[response.status]
      const _parseBody = parseBody(
        ApiResponse.getBodySchema(responseSpec) as Schema.Schema<any, any, never>,
        ApiResponse.getRepresentations(responseSpec)
      )
      const body = yield* _(_parseBody(response))

      if (!isFullResponse) {
        return body
      }

      const headersSchema = ApiResponse.getHeadersSchema(responseSpec)

      const headers = ApiSchema.isIgnored(headersSchema)
        ? undefined
        : yield* _(
          response.headers,
          Schema.decodeUnknown(headersSchema as Schema.Schema<any, any, never>),
          Effect.mapError(
            ClientError.makeClientSideResponseValidation("headers")
          )
        )

      return { status: response.status, body, headers }
    })
  )
}

const handleUnsucessful = Unify.unify(
  (response: ClientResponse.ClientResponse) => {
    if (response.status >= 300) {
      return response.json.pipe(
        Effect.orElse(() => response.text),
        Effect.orElseSucceed(() => "No body provided"),
        Effect.flatMap((error) => Effect.fail(ClientError.makeServerSide(error, response.status)))
      )
    }

    return Effect.unit
  }
)

const representationFromResponse = (
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>,
  response: ClientResponse.ClientResponse
): Representation.Representation => {
  if (representations.length === 0) {
    representations[0]
  }

  const contentType = response.headers["content-type"]

  // TODO: this logic needs to be improved a lot!
  return pipe(
    representations,
    ReadonlyArray.filter(
      (representation) => representation.contentType === contentType
    ),
    ReadonlyArray.head,
    Option.getOrElse(() => representations[0])
  )
}

const decodeBody = (
  schema: Schema.Schema<any, any, never>,
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
) => {
  const parse = Schema.decodeUnknown(schema)

  return (response: ClientResponse.ClientResponse) => {
    const representation = representationFromResponse(
      representations,
      response
    )

    return response.text.pipe(
      Effect.mapError((error) => ClientError.makeClientSide(error, `Invalid response: ${error.reason}`)),
      Effect.flatMap(
        flow(
          representation.parse,
          Effect.mapError((error) =>
            ClientError.makeClientSide(
              error,
              `Invalid response: ${error.message}`
            )
          )
        )
      ),
      Effect.flatMap(
        flow(
          parse,
          Effect.mapError(ClientError.makeClientSideResponseValidation("body"))
        )
      )
    )
  }
}

const parseBody: (
  schema: Schema.Schema<any, any, never> | ApiSchema.Ignored,
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
) => (
  response: ClientResponse.ClientResponse
) => Effect.Effect<any, ClientError.ClientError> = (
  schema,
  representations
) => {
  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  return decodeBody(schema, representations)
}
