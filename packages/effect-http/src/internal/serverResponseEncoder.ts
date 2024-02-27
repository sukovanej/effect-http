import * as Body from "@effect/platform/Http/Body"
import type * as Headers from "@effect/platform/Http/Headers"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import { flow, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Api from "../Api.js"
import * as Representation from "../Representation.js"
import * as ServerError from "../ServerError.js"
import { formatParseError } from "./formatParseError.js"

interface ServerResponseEncoder {
  encodeResponse: (
    request: ServerRequest.ServerRequest,
    inputResponse: unknown
  ) => Effect.Effect<ServerResponse.ServerResponse, ServerError.ServerError>
}

const createErrorResponse = (error: string, message: string) => ServerError.makeJson(500, { error, message })

const make = (
  encodeResponse: ServerResponseEncoder["encodeResponse"]
): ServerResponseEncoder => ({ encodeResponse })

export const create = (
  responseSchema: Api.EndpointSchemas["response"]
): ServerResponseEncoder => {
  if (responseSchema === Api.IgnoredSchemaId) {
    return make(() => ServerResponse.empty())
  } else if (Schema.isSchema(responseSchema)) {
    return fromSchema(responseSchema as Schema.Schema<any, any, never>)
  } else if (Array.isArray(responseSchema)) {
    return fromResponseSchemaFullArray(responseSchema)
  }

  return fromResponseSchemaFullArray([responseSchema] as ReadonlyArray<Api.ResponseSchemaFull>)
}

const representationFromRequest = (
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>,
  request: ServerRequest.ServerRequest
): Representation.Representation => {
  if (representations.length === 0) {
    representations[0]
  }

  const accept = request.headers["accept"]

  // TODO: this logic needs to be improved a lot!
  return pipe(
    representations,
    ReadonlyArray.filter(
      (representation) => representation.contentType === accept
    ),
    ReadonlyArray.head,
    Option.getOrElse(() => representations[0])
  )
}

const encodeContent = (schema: Schema.Schema<any, any, never>) => {
  const encode = Schema.encode(schema)

  return (content: unknown, representation: Representation.Representation) =>
  (response: ServerResponse.ServerResponse) =>
    pipe(
      encode(content),
      Effect.mapError((error) =>
        createErrorResponse(
          "Invalid response content",
          formatParseError(error)
        )
      ),
      Effect.flatMap(
        flow(
          representation.stringify,
          Effect.mapError((error) => createErrorResponse("Invalid response content", error.message))
        )
      ),
      Effect.map((content) =>
        response.pipe(
          ServerResponse.setBody(
            Body.text(content, representation.contentType)
          )
        )
      )
    )
}

const fromSchema = (schema: Schema.Schema<any, any, never>): ServerResponseEncoder => {
  const encode = encodeContent(schema)
  const representation = Representation.json

  return make((_, inputResponse) =>
    ServerResponse.empty({ status: 200 }).pipe(
      encode(inputResponse, representation)
    )
  )
}

const fromResponseSchemaFullArray = (
  schemas: ReadonlyArray<Api.ResponseSchemaFull>
): ServerResponseEncoder => {
  const statusToSchema = schemas.reduce(
    (obj, schemas) => ({ ...obj, [schemas.status]: schemas }),
    {} as Record<number, Api.ResponseSchemaFull>
  )

  return make((request, inputResponse) =>
    Effect.gen(function*(_) {
      const _input = yield* _(
        parseFullResponseInput(inputResponse),
        Effect.orDie
      )

      const schemas = statusToSchema[_input.status]
      const setContent = createContentSetter(schemas)
      const setHeaders = createHeadersSetter(schemas)

      const representation = representationFromRequest(
        schemas.representations,
        request
      )

      return yield* _(
        ServerResponse.empty({ status: _input.status }).pipe(
          setContent(_input, representation),
          Effect.flatMap(setHeaders(_input))
        )
      )
    })
  )
}

const createContentSetter = (schema: Api.ResponseSchemaFull) => {
  const contentSchema = schema.content === Api.IgnoredSchemaId ? undefined : schema.content
  const encode = contentSchema && encodeContent(contentSchema as Schema.Schema<any, any, never>)

  return (
    inputResponse: FullResponseInput,
    representation: Representation.Representation
  ) =>
  (response: ServerResponse.ServerResponse) => {
    if (encode === undefined && inputResponse.content !== undefined) {
      return Effect.die("Unexpected response content")
    } else if (encode !== undefined && inputResponse.content === undefined) {
      return Effect.die("Response content not provided")
    } else if (encode === undefined) {
      return Effect.succeed(response)
    }

    return pipe(response, encode(inputResponse.content, representation))
  }
}

const createHeadersSetter = (schema: Api.ResponseSchemaFull) => {
  const parseHeaders = schema.headers === Api.IgnoredSchemaId
    ? undefined
    : Schema.encode(schema.headers as Schema.Schema<any, any, never>)

  return (inputResponse: FullResponseInput) => (response: ServerResponse.ServerResponse) => {
    if (parseHeaders === undefined && inputResponse.headers !== undefined) {
      return Effect.die("Unexpected response headers")
    } else if (
      parseHeaders !== undefined &&
      inputResponse.headers === undefined
    ) {
      return Effect.die("Response headers not provided")
    } else if (parseHeaders === undefined) {
      return Effect.succeed(response)
    }

    return parseHeaders(inputResponse.headers).pipe(
      Effect.map((headers) => response.pipe(ServerResponse.setHeaders(headers as Headers.Input))),
      Effect.mapError((error) =>
        createErrorResponse(
          "Invalid response headers",
          formatParseError(error)
        )
      )
    )
  }
}

const FullResponseInput = Schema.struct({
  content: Schema.optional(Schema.unknown),
  headers: Schema.optional(Schema.record(Schema.string, Schema.unknown)),
  status: Schema.number
})
type FullResponseInput = Schema.Schema.To<typeof FullResponseInput>

const parseFullResponseInput = Schema.decodeUnknown(FullResponseInput)
