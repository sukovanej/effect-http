import * as PlatformClient from "@effect/platform/Http/Client"
import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as HttpClient from "@effect/platform/HttpClient"
import * as Effect from "effect/Effect"
import * as Encoding from "effect/Encoding"
import { dual, identity, pipe } from "effect/Function"
import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as Client from "../Client.js"
import * as ClientRequestEncoder from "./clientRequestEncoder.js"
import * as ClientResponseParser from "./clientResponseParser.js"

/** @internal */
const defaultHttpClient = PlatformClient.fetch()

/** @internal */
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

  return ((args: unknown, mapper?: (request: HttpClient.request.ClientRequest) => HttpClient.request.ClientRequest) =>
    pipe(
      requestEncoder.encodeRequest(args),
      Effect.map(mapper ?? identity),
      Effect.map(mapRequest),
      Effect.flatMap(httpClient),
      Effect.catchTags({
        RequestError: Effect.die, // TODO handle
        ResponseError: Effect.die, // TODO handle
        ClientError: (err) => Effect.fail(err)
      }),
      Effect.flatMap(responseParser.parseResponse),
      Effect.scoped,
      Effect.annotateLogs("clientOperationId", ApiEndpoint.getId(endpoint))
    ))
}

/** @internal */
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

/** @internal */
export const setBasicAuth = dual(
  3,
  (request: HttpClient.request.ClientRequest, user: string, pass: string): HttpClient.request.ClientRequest =>
    HttpClient.request.setHeader(request, "Authorization", `Basic ${Encoding.encodeBase64(`${user}:${pass}`)}`)
)

/** @internal */
export const setBearer = dual(
  2,
  (request: HttpClient.request.ClientRequest, token: string): HttpClient.request.ClientRequest =>
    HttpClient.request.setHeader(request, "Authorization", `Bearer ${token}`)
)

/** @internal */
export const setApiKey = dual(4, (
  request: HttpClient.request.ClientRequest,
  key: string,
  _in: "query" | "header",
  apiKey: string
): HttpClient.request.ClientRequest =>
  _in === "query"
    ? HttpClient.request.setUrlParam(request, key, apiKey)
    : HttpClient.request.setHeader(request, key, apiKey))
