/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as HttpClient from "@effect/platform/HttpClient"
import type * as Effect from "effect/Effect"

import type * as Types from "effect/Types"
import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiRequest from "./ApiRequest.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as ClientError from "./ClientError.js"
import * as internal from "./internal/client.js"
import type * as utils from "./internal/utils.js"

/**
 * @category models
 * @since 1.0.0
 */
export type Client<A extends Api.Api.Any> = Types.Simplify<
  {
    [Id in Api.Api.Ids<A>]: EndpointClient<Api.Api.EndpointById<A, Id>>
  }
>

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  httpClient?: HttpClient.client.Client.Default
  baseUrl?: string
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const endpointClient: <A extends Api.Api.Any, Id extends Api.Api.Ids<A>>(
  id: Id,
  api: A,
  options: Partial<Options>
) => EndpointClient<Api.Api.EndpointById<A, Id>> = internal.endpointClient

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any>(
  api: A,
  options?: Partial<Options>
) => Client<A> = internal.make

/**
 * @category auth
 * @since 1.0.0
 */
export const setBasic: {
  (user: string, pass: string): (request: HttpClient.request.ClientRequest) => HttpClient.request.ClientRequest
  (request: HttpClient.request.ClientRequest, user: string, pass: string): HttpClient.request.ClientRequest
} = internal.setBasicAuth

/**
 * @category auth
 * @since 1.0.0
 */
export const setBearer: {
  (token: string): (request: HttpClient.request.ClientRequest) => HttpClient.request.ClientRequest
  (request: HttpClient.request.ClientRequest, token: string): HttpClient.request.ClientRequest
} = internal.setBearer

/**
 * @category auth
 * @since 1.0.0
 */
export const setApiKey: {
  (
    key: string,
    _in: "query" | "header",
    apiKey: string
  ): (request: HttpClient.request.ClientRequest) => HttpClient.request.ClientRequest
  (
    request: HttpClient.request.ClientRequest,
    key: string,
    _in: "query" | "header",
    apiKey: string
  ): HttpClient.request.ClientRequest
} = internal.setApiKey

/**
 * @category models
 * @since 1.0.0
 */
export interface Response<S extends ApiResponse.ApiResponse.AnyStatus, B, H> {
  status: S
  body: B
  headers: H
}

// Internal type helpers

/** @ignore */
export type ClientFunctionResponse<
  R extends ApiResponse.ApiResponse.Any
> = _ClientFunctionResponse<utils.FilterNon200Responses<R>>

/** @ignore */
export type _ClientFunctionResponse<
  R extends ApiResponse.ApiResponse.Any
> = utils.IsUnion<R> extends true ? R extends any ? Response<
      ApiResponse.ApiResponse.Status<R>,
      ApiResponse.ApiResponse.Body<R>,
      ApiResponse.ApiResponse.Headers<R>
    > :
  never
  : utils.NeedsFullResponse<R> extends true ? Response<
      ApiResponse.ApiResponse.Status<R>,
      ApiResponse.ApiResponse.Body<R>,
      ApiResponse.ApiResponse.Headers<R>
    >
  : utils.IgnoredToVoid<ApiResponse.ApiResponse.Body<R>>

/** @ignore */
export type ToRequest<
  R extends ApiRequest.ApiRequest.Any
> = utils.RemoveIgnoredFields<{
  readonly body: ApiRequest.ApiRequest.Body<R>
  readonly path: ApiRequest.ApiRequest.Path<R>
  readonly query: ApiRequest.ApiRequest.Query<R>
  readonly headers: ApiRequest.ApiRequest.Headers<R>
}>

/** @ignore */
export type EndpointClient<E extends ApiEndpoint.ApiEndpoint.Any> = (
  input: ToRequest<ApiEndpoint.ApiEndpoint.Request<E>>,
  map?: (request: HttpClient.request.ClientRequest) => HttpClient.request.ClientRequest
) => Effect.Effect<
  ClientFunctionResponse<ApiEndpoint.ApiEndpoint.Response<E>>,
  ClientError.ClientError,
  ApiEndpoint.ApiEndpoint.Context<E>
>
