import type * as Headers from "@effect/platform/Headers"
import * as HttpBody from "@effect/platform/HttpBody"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import { flow, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as Unify from "effect/Unify"

import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiResponse from "../ApiResponse.js"
import * as ApiSchema from "../ApiSchema.js"
import * as HttpError from "../HttpError.js"
import type * as Representation from "../Representation.js"

/** @internal */
interface ServerResponseEncoder {
  encodeResponse: (
    inputResponse: unknown
  ) => Effect.Effect<HttpServerResponse.HttpServerResponse, HttpError.HttpError, HttpServerRequest.HttpServerRequest>
}

/** @internal */
const createErrorResponse = (error: string, message: string) => HttpError.make(500, { error, message })

/** @internal */
const make = (
  encodeResponse: ServerResponseEncoder["encodeResponse"]
): ServerResponseEncoder => ({ encodeResponse })

/** @internal */
export const create = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
): ServerResponseEncoder => {
  const responses = ApiEndpoint.getResponse(endpoint)
  const isFullResponse = ApiEndpoint.isFullResponse(endpoint)
  const statusToSpec = responses.reduce(
    (obj, response) => ({ ...obj, [ApiResponse.getStatus(response)]: response }),
    {} as Record<number, ApiResponse.ApiResponse.Any>
  )

  return make((inputResponse) =>
    pipe(
      Unify.unify(
        isFullResponse ?
          Effect.mapError(
            parseFullResponseInput(inputResponse),
            () => createErrorResponse("Invalid response", "Server handler returned unexpected response")
          )
          : Effect.succeed({ status: ApiResponse.getStatus(responses[0]), body: inputResponse })
      ),
      Effect.zip(HttpServerRequest.HttpServerRequest),
      Effect.flatMap(([parseInputResponse, request]) => {
        const response = statusToSpec[parseInputResponse.status]
        const setBody = createBodySetter(response)
        const setHeaders = createHeadersSetter(response)

        const representation = representationFromRequest(
          ApiResponse.getRepresentations(response),
          request
        )

        return HttpServerResponse.empty({ status: parseInputResponse.status }).pipe(
          setBody(parseInputResponse, representation),
          Effect.flatMap(setHeaders(parseInputResponse))
        )
      })
    )
  )
}

/** @internal */
const representationFromRequest = (
  representations: Array.NonEmptyReadonlyArray<Representation.Representation>,
  request: HttpServerRequest.HttpServerRequest
): Representation.Representation => {
  if (representations.length === 0) {
    return representations[0]
  }

  const accept = request.headers["accept"]

  // TODO: this logic needs to be improved a lot!
  return pipe(
    representations,
    Array.filter(
      (representation) => representation.contentType === accept
    ),
    Array.head,
    Option.getOrElse(() => representations[0])
  )
}

/** @internal */
const encodeBody = (schema: Schema.Schema<any, any, never>) => {
  const encode = Schema.encode(schema)

  return (body: unknown, representation: Representation.Representation) =>
  (response: HttpServerResponse.HttpServerResponse) =>
    pipe(
      encode(body),
      Effect.mapError((error) => createErrorResponse("Invalid response body", error.message)),
      Effect.flatMap(
        flow(
          representation.stringify,
          Effect.mapError((error) => createErrorResponse("Invalid response body", error.message))
        )
      ),
      Effect.map((body) =>
        response.pipe(
          HttpServerResponse.setBody(
            HttpBody.text(body, representation.contentType)
          )
        )
      )
    )
}

/** @internal */
const createBodySetter = (response: ApiResponse.ApiResponse.Any) => {
  const body = ApiResponse.getBodySchema(response)
  const bodySchema = ApiSchema.isIgnored(body) ? undefined : body
  const encode = bodySchema && encodeBody(bodySchema as Schema.Schema<any, any, never>)

  return (
    inputResponse: FullResponseInput,
    representation: Representation.Representation
  ) =>
  (response: HttpServerResponse.HttpServerResponse) => {
    if (encode === undefined && inputResponse.body !== undefined) {
      return Effect.die("Unexpected response body")
    } else if (encode !== undefined && inputResponse.body === undefined) {
      return Effect.die("Response body not provided")
    } else if (encode === undefined) {
      return Effect.succeed(response)
    }

    return pipe(response, encode(inputResponse.body, representation))
  }
}

/** @internal */
const createHeadersSetter = (schema: ApiResponse.ApiResponse.Any) => {
  const headers = ApiResponse.getHeadersSchema(schema)

  const parseHeaders = ApiSchema.isIgnored(headers)
    ? undefined
    : Schema.encode(headers as Schema.Schema<any, any, never>)

  return (inputResponse: FullResponseInput) => (response: HttpServerResponse.HttpServerResponse) => {
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
      Effect.map((headers) => response.pipe(HttpServerResponse.setHeaders(headers as Headers.Input))),
      Effect.mapError((error) =>
        createErrorResponse(
          "Invalid response headers",
          error.message
        )
      )
    )
  }
}

/** @internal */
const FullResponseInput = Schema.Struct({
  body: Schema.optional(Schema.Unknown),
  headers: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  status: Schema.Number
})

/** @internal */
type FullResponseInput = Schema.Schema.Type<typeof FullResponseInput>

/** @internal */
const parseFullResponseInput = Schema.decodeUnknown(FullResponseInput)
