import { ExampleCompiler } from "schema-openapi"

import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type * as Api from "../Api.js"
import type * as Client from "../Client.js"
import type * as MockClient from "../MockClient.js"
import * as ClientRequestEncoder from "./clientRequestEncoder.js"
import * as utils from "./utils.js"

export const make = <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  option?: Partial<MockClient.Options<Endpoints>>
): Client.Client<Endpoints> =>
  api.groups.flatMap((group) => group.endpoints).reduce((client, endpoint) => {
    const requestEncoder = ClientRequestEncoder.create(endpoint)
    const responseSchema = utils.createResponseSchema(
      endpoint.schemas.response
    )

    const customResponses = option?.responses
    const customResponse = customResponses && customResponses[endpoint.id as Endpoints["id"]]

    const fn = (args: unknown, security: unknown) => {
      return pipe(
        requestEncoder.encodeRequest(args, security),
        Effect.flatMap(() => {
          if (customResponse !== undefined) {
            return Effect.succeed(customResponse)
          } else if (responseSchema === undefined) {
            return Effect.unit
          }

          return ExampleCompiler.randomExample(responseSchema)
        })
      )
    }

    return { ...client, [endpoint.id]: fn }
  }, {} as Client.Client<Endpoints>)
