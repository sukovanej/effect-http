/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as HttpClient from "@effect/platform/HttpClient"
import type * as Schema from "@effect/schema/Schema"
import type * as Effect from "effect/Effect"
import type * as ReadonlyRecord from "effect/ReadonlyRecord"

import type * as Types from "effect/Types"
import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiRequest from "./ApiRequest.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as ApiSchema from "./ApiSchema.js"
import type * as ClientError from "./ClientError.js"
import * as internal from "./internal/client.js"
import type * as utils from "./internal/utils.js"
import type * as SecurityScheme from "./SecurityScheme.js"

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
  mapRequest?: (
    request: HttpClient.request.ClientRequest
  ) => HttpClient.request.ClientRequest
  httpClient?: HttpClient.client.Client.Default
  baseUrl: string
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
type FilterNon200Responses<R extends ApiResponse.ApiResponse.Any> = R extends any ?
  `${ApiResponse.ApiResponse.Status<R>}` extends `2${string}` ? R : never :
  never

/** @ignore */
export type ClientFunctionResponse<
  R extends ApiResponse.ApiResponse.Any
> = _ClientFunctionResponse<FilterNon200Responses<R>>

/** @ignore */
export type _ClientFunctionResponse<
  R extends ApiResponse.ApiResponse.Any
> = utils.IsUnion<R> extends true ? R extends any ? Response<
      ApiResponse.ApiResponse.Status<R>,
      ApiResponse.ApiResponse.Body<R>,
      ApiResponse.ApiResponse.Headers<R>
    > :
  never
  : NeedsFullResponse<R> extends true ? Response<
      ApiResponse.ApiResponse.Status<R>,
      ApiResponse.ApiResponse.Body<R>,
      ApiResponse.ApiResponse.Headers<R>
    >
  : ApiResponse.ApiResponse.Body<R>

/** @ignore */
type NeedsFullResponse<R extends ApiResponse.ApiResponse.Any> = ApiResponse.ApiResponse.Headers<R> extends
  ApiSchema.Ignored ? false : true

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
export type EndpointClient<E extends ApiEndpoint.ApiEndpoint.Any> = Record<string, never> extends
  ApiEndpoint.ApiEndpoint.Security<E> ? (
    input: ToRequest<ApiEndpoint.ApiEndpoint.Request<E>>
  ) => Effect.Effect<
    ClientFunctionResponse<ApiEndpoint.ApiEndpoint.Response<E>>,
    ClientError.ClientError,
    ApiEndpoint.ApiEndpoint.Context<E>
  > :
  (
    input: ToRequest<ApiEndpoint.ApiEndpoint.Request<E>>,
    security: ClientSecurity<ApiEndpoint.ApiEndpoint.Security<E>>
  ) => Effect.Effect<
    ClientFunctionResponse<ApiEndpoint.ApiEndpoint.Response<E>>,
    ClientError.ClientError,
    ApiEndpoint.ApiEndpoint.Context<E>
  >

/** @ignore */
type ClientSecurity<SS extends ReadonlyRecord.ReadonlyRecord<string, SecurityScheme.SecurityScheme<any>>> =
  keyof SS extends infer K ?
    K extends (infer securitySchemeName extends keyof SS) ?
      { [X in securitySchemeName]: Schema.Schema.Type<SS[securitySchemeName]["schema"]> }
    : never
    : never
