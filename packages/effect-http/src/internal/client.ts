import * as PlatformClient from "@effect/platform/Http/Client"
import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as Effect from "effect/Effect"
import { identity, pipe } from "effect/Function"
import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as Client from "../Client.js"
import * as ClientRequestEncoder from "./clientRequestEncoder.js"
import * as ClientResponseParser from "./clientResponseParser.js"

/** @internal */
const defaultHttpClient = PlatformClient.fetch()

export const endpointClient = <
  A extends Api.Api.Any,
  Id extends Api.Api.Ids<A>
>(
  id: Id,
  api: A,
  options: Partial<Client.Options>
): Client.EndpointClient<Api.Api.EndpointById<A, Id>> => {
  const endpoint = Api.getEndpoint(api, id)
  const responseParser = ClientResponseParser.create(endpoint)
  const requestEncoder = ClientRequestEncoder.create(endpoint)

  let mapRequest = options.mapRequest ?? identity

  if (options.baseUrl) {
    mapRequest = ClientRequest.prependUrl(options.baseUrl)
  }

  const httpClient = options.httpClient ?? defaultHttpClient

  return ((args: unknown, security: unknown) =>
    pipe(
      requestEncoder.encodeRequest(args, security),
      Effect.map(mapRequest),
      Effect.flatMap(httpClient),
      Effect.flatMap(responseParser.parseResponse),
      Effect.scoped,
      Effect.annotateLogs("clientOperationId", ApiEndpoint.getId(endpoint))
    )) as any
}

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make = <A extends Api.Api.Any>(
  api: A,
  options?: Partial<Client.Options>
): Client.Client<A> =>
  api.groups.flatMap((group) => group.endpoints).reduce(
    (client, endpoint) => ({
      ...client as any,
      [ApiEndpoint.getId(endpoint)]: endpointClient(ApiEndpoint.getId(endpoint) as any, api, options ?? {})
    }),
    {} as Client.Client<A>
  )
