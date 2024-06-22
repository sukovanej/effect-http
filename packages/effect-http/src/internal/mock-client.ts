import type * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Effect from "effect/Effect"
import { identity, pipe } from "effect/Function"

import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as Client from "../Client.js"
import type * as MockClient from "../MockClient.js"
import * as ClientRequestEncoder from "./clientRequestEncoder.js"
import * as example_compiler from "./example-compiler.js"
import * as utils from "./utils.js"

/** @internal */
export const make = <A extends Api.Api.Any>(
  api: A,
  option?: Partial<MockClient.Options<A>>
): Client.Client<A> =>
  api.groups.flatMap((group) => group.endpoints).reduce((client, endpoint) => {
    const requestEncoder = ClientRequestEncoder.create(endpoint)
    const responseSchema = utils.createResponseSchema(endpoint)

    const customResponses = option?.responses
    const customResponse = customResponses && (customResponses as any)[ApiEndpoint.getId(endpoint)]

    const fn = (
      args: unknown,
      mapRequest: (request: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest
    ) => {
      return pipe(
        requestEncoder.encodeRequest(args),
        Effect.map(mapRequest ?? identity),
        Effect.flatMap(() => {
          if (customResponse !== undefined) {
            return Effect.succeed(customResponse)
          } else if (responseSchema === undefined) {
            return Effect.void
          }

          return example_compiler.randomExample(responseSchema)
        })
      )
    }

    return { ...client as any, [ApiEndpoint.getId(endpoint)]: fn }
  }, {} as Client.Client<A>)
