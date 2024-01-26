import type * as ClientResponse from "@effect/platform/Http/ClientResponse"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import { flow, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Unify from "effect/Unify"
import * as Api from "../Api.js"
import * as ClientError from "../ClientError.js"
import * as Representation from "../Representation.js"

interface ClientResponseParser {
  parseResponse: (
    response: ClientResponse.ClientResponse
  ) => Effect.Effect<never, ClientError.ClientError, any>
}

const make = (
  parseResponse: ClientResponseParser["parseResponse"]
): ClientResponseParser => ({ parseResponse })

export const create = (
  responseSchema: Api.EndpointSchemas["response"]
): ClientResponseParser => {
  if (Schema.isSchema(responseSchema)) {
    return fromSchema(responseSchema as Schema.Schema<never, any>)
  } else if (Array.isArray(responseSchema)) {
    return fromResponseSchemaFullArray(responseSchema)
  }

  return fromResponseSchemaFullArray([responseSchema] as ReadonlyArray<Api.ResponseSchemaFull>)
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

const fromSchema = (schema: Schema.Schema<never, any>): ClientResponseParser => {
  const decode = decodeBody(schema, [Representation.json])

  return make((response) => handleUnsucessful(response).pipe(Effect.flatMap(() => decode(response))))
}

const fromResponseSchemaFullArray = (
  schemas: ReadonlyArray<Api.ResponseSchemaFull>
): ClientResponseParser => {
  const statusToSchema = schemas.reduce(
    (obj, schemas) => ({ ...obj, [schemas.status]: schemas }),
    {} as Record<number, Api.ResponseSchemaFull>
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

      const schemas = statusToSchema[response.status]
      const parseBody = parseContent(schemas.content as Schema.Schema<never, any>, schemas.representations)
      const content = yield* _(parseBody(response))

      const headers = schemas.headers === Api.IgnoredSchemaId
        ? undefined
        : yield* _(
          response.headers,
          Schema.decodeUnknown(schemas.headers as Schema.Schema<never, any>),
          Effect.mapError(
            ClientError.makeClientSideResponseValidation("headers")
          )
        )

      return { status: response.status, content, headers }
    })
  )
}

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
  schema: Schema.Schema<never, any>,
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

const parseContent: (
  schema: Schema.Schema<never, any> | Api.IgnoredSchemaId,
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
) => (
  response: ClientResponse.ClientResponse
) => Effect.Effect<never, ClientError.ClientError, any> = (
  schema,
  representations
) => {
  if (schema === Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined)
  }

  return decodeBody(schema, representations)
}
