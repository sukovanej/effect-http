import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Effect from "effect/Effect"
import * as Encoding from "effect/Encoding"
import { dual, identity, pipe } from "effect/Function"
import * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as Client from "../Client.js"
import * as ClientError from "../ClientError.js"
import * as ClientRequestEncoder from "./clientRequestEncoder.js"
import * as ClientResponseParser from "./clientResponseParser.js"

/** @internal */
const defaultHttpClient = HttpClient.fetch

/** @internal */
export const endpointClient = <A extends Api.Api.Any, Id extends Api.Api.Ids<A>>(
  id: Id,
  api: A,
  options: Partial<Client.Options>
): Client.Client.Function<Api.Api.EndpointById<A, Id>> => {
  const endpoint = Api.getEndpoint(api, id)
  const responseParser = ClientResponseParser.create(endpoint)
  const requestEncoder = ClientRequestEncoder.create(endpoint)

  const httpClient = (options.httpClient ?? defaultHttpClient).pipe(
    options.baseUrl ?
      HttpClient.mapRequest(HttpClientRequest.prependUrl(options.baseUrl)) :
      identity
  )

  return ((
    args: unknown,
    mapper?: (request: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest
  ) =>
    pipe(
      requestEncoder.encodeRequest(args),
      Effect.map(mapper ?? identity),
      Effect.flatMap(httpClient),
      Effect.catchTags({
        RequestError: (err) => ClientError.makeClientSide(err.cause, err.message),
        ResponseError: (err) => ClientError.makeServerSide(err.cause, err.response.status, err.message),
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
  (request: HttpClientRequest.HttpClientRequest, user: string, pass: string): HttpClientRequest.HttpClientRequest =>
    HttpClientRequest.setHeader(request, "Authorization", `Basic ${Encoding.encodeBase64(`${user}:${pass}`)}`)
)

/** @internal */
export const setBearer = dual(
  2,
  (request: HttpClientRequest.HttpClientRequest, token: string): HttpClientRequest.HttpClientRequest =>
    HttpClientRequest.setHeader(request, "Authorization", `Bearer ${token}`)
)

/** @internal */
export const setApiKey = dual(4, (
  request: HttpClientRequest.HttpClientRequest,
  key: string,
  _in: "query" | "header",
  apiKey: string
): HttpClientRequest.HttpClientRequest =>
  _in === "query"
    ? HttpClientRequest.setUrlParam(request, key, apiKey)
    : HttpClientRequest.setHeader(request, key, apiKey))
