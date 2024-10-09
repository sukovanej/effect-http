/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as HttpClient from "@effect/platform/HttpClient"
import type * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import type * as Effect from "effect/Effect"
import type * as Types from "effect/Types"

import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as ClientError from "./ClientError.js"
import type * as Handler from "./Handler.js"
import * as internal from "./internal/client.js"

/**
 * @category models
 * @since 1.0.0
 */
export type Client<A extends Api.Api.Any> = Types.Simplify<
  {
    [Id in Api.Api.Ids<A>]: Client.Function<Api.Api.EndpointById<A, Id>>
  }
>

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  httpClient?: HttpClient.HttpClient
  baseUrl?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace Client {
  /**
   * @category models
   * @since 1.0.0
   */
  export type Function<E extends ApiEndpoint.ApiEndpoint.Any> = (
    input: Handler.Handler.ToRequest<ApiEndpoint.ApiEndpoint.Request<E>>,
    map?: (request: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<
    Handler.Handler.ToResponse<ApiEndpoint.ApiEndpoint.Response<E>>,
    ClientError.ClientError,
    ApiEndpoint.ApiEndpoint.ContextNoSecurity<E>
  >
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const endpointClient: <A extends Api.Api.Any, Id extends Api.Api.Ids<A>>(
  id: Id,
  api: A,
  options: Partial<Options>
) => Client.Function<Api.Api.EndpointById<A, Id>> = internal.endpointClient

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
  (user: string, pass: string): (request: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest
  (request: HttpClientRequest.HttpClientRequest, user: string, pass: string): HttpClientRequest.HttpClientRequest
} = internal.setBasicAuth

/**
 * @category auth
 * @since 1.0.0
 */
export const setBearer: {
  (token: string): (request: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest
  (request: HttpClientRequest.HttpClientRequest, token: string): HttpClientRequest.HttpClientRequest
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
  ): (request: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest
  (
    request: HttpClientRequest.HttpClientRequest,
    key: string,
    _in: "query" | "header",
    apiKey: string
  ): HttpClientRequest.HttpClientRequest
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
