/**
 * HTTP endpoint declaration.
 *
 * @since 1.0.0
 */
import type * as HttpMethod from "@effect/platform/HttpMethod"
import type * as HttpRouter from "@effect/platform/HttpRouter"
import type * as Schema from "@effect/schema/Schema"
import type * as Array from "effect/Array"
import type * as Pipeable from "effect/Pipeable"
import type * as Types from "effect/Types"

import type * as ApiRequest from "./ApiRequest.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as ApiSchema from "./ApiSchema.js"
import * as internal from "./internal/api-endpoint.js"
import type * as Representation from "./Representation.js"
import type * as Security from "./Security.js"

/**
 * @since 1.0.0
 * @category type id
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type TypeId = typeof TypeId

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  readonly deprecated?: boolean
  readonly description?: string
  readonly summary?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiEndpoint<
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  _Security extends Security.Security.Any
> extends ApiEndpoint.Variance<Id, Request, Response, _Security>, Pipeable.Pipeable {}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace ApiEndpoint {
  /**
   * @category models
   * @since 1.0.0
   */
  export interface Variance<
    Id,
    Request extends ApiRequest.ApiRequest.Any,
    Response extends ApiResponse.ApiResponse.Any,
    Security extends Security.Security.Any
  > {
    readonly [TypeId]: {
      readonly _Id: Types.Covariant<Id>
      readonly _Request: Types.Covariant<Request>
      readonly _Response: Types.Covariant<Response>
      readonly _Security: Types.Covariant<Security>
    }
  }

  /**
   * Any endpoint id.
   *
   * @category models
   * @since 1.0.0
   */
  export type AnyId = string

  /**
   * Any endpoint with `Request = Request.Any` and `Response = Response.Any`.
   *
   * @category models
   * @since 1.0.0
   */
  export type Any = ApiEndpoint<AnyId, ApiRequest.ApiRequest.Any, ApiResponse.ApiResponse.Any, Security.Security.Any>

  /**
   * Default endpoint spec.
   *
   * @category models
   * @since 1.0.0
   */
  export type Default<Id extends AnyId> = ApiEndpoint<
    Id,
    ApiRequest.ApiRequest.Default,
    ApiResponse.ApiResponse.Default,
    Security.Security.Default
  >

  /**
   * @category models
   * @since 1.0.0
   */
  export type Context<Endpoint> = [Endpoint] extends [ApiEndpoint<any, infer Request, infer Response, infer S>]
    ? ApiRequest.ApiRequest.Context<Request> | ApiResponse.ApiResponse.Context<Response> | Security.Security.Context<S>
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type ContextNoSecurity<Endpoint> = [Endpoint] extends [ApiEndpoint<any, infer Request, infer Response, any>]
    ? ApiRequest.ApiRequest.Context<Request> | ApiResponse.ApiResponse.Context<Response>
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type ExtractById<Endpoint, Id extends AnyId> = Endpoint extends ApiEndpoint<Id, any, any, any> ? Endpoint
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type ExcludeById<Endpoint extends Any, Id extends AnyId> = Endpoint extends ApiEndpoint<Id, any, any, any> ?
    never
    : Endpoint

  /**
   * @category models
   * @since 1.0.0
   */
  export type Id<Endpoint> = Endpoint extends ApiEndpoint<infer Id, any, any, any> ? Id
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Request<Endpoint> = Endpoint extends ApiEndpoint<any, infer Request, any, any> ? Request
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Response<Endpoint> = Endpoint extends ApiEndpoint<any, any, infer Response, any> ? Response
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Security<Endpoint> = Endpoint extends ApiEndpoint<any, any, any, infer Security> ? Security
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export type Error<Endpoint> = [Endpoint] extends [ApiEndpoint<any, any, any, infer S>] ? Security.Security.Error<S>
    : never
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <Id extends ApiEndpoint.AnyId>(
  method: HttpMethod.HttpMethod,
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<Options>
) => ApiEndpoint.Default<Id> = internal.make

/**
 * @category constructors
 * @since 1.0.0
 */
export const get: <Id extends ApiEndpoint.AnyId>(
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<Options>
) => ApiEndpoint.Default<Id> = (...args) => make("GET", ...args)

/**
 * @category constructors
 * @since 1.0.0
 */
export const post: <Id extends ApiEndpoint.AnyId>(
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<Options>
) => ApiEndpoint.Default<Id> = (...args) => make("POST", ...args)

/**
 * @category constructors
 * @since 1.0.0
 */
export const put: <Id extends ApiEndpoint.AnyId>(
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<Options>
) => ApiEndpoint.Default<Id> = (...args) => make("PUT", ...args)

/**
 * @category constructors
 * @since 1.0.0
 */
export const patch: <Id extends ApiEndpoint.AnyId>(
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<Options>
) => ApiEndpoint.Default<Id> = (...args) => make("PATCH", ...args)

const _delete: <Id extends ApiEndpoint.AnyId>(
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<Options>
) => ApiEndpoint.Default<Id> = (...args) => make("DELETE", ...args)

export {
  /**
   * @category constructors
   * @since 1.0.0
   */
  _delete as delete
}

/**
 * @category modifications
 * @since 1.0.0
 */
export const setRequest: <Request extends ApiRequest.ApiRequest.Any>(
  request: Request
) => <
  Id extends ApiEndpoint.AnyId,
  _ extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, _, Response, Security>
) => ApiEndpoint<Id, Request, Response, Security> = internal.setRequest

/**
 * @category modifications
 * @since 1.0.0
 */
export const setRequestBody: <B, R2>(
  schema: Schema.Schema<B, any, R2>
) => <
  Id extends ApiEndpoint.AnyId,
  _,
  P,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, ApiRequest.ApiRequest<_, P, Q, H, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> = internal.setRequestBody

/**
 * @category modifications
 * @since 1.0.0
 */
export const setRequestPath: <P, I extends Readonly<Record<string, string | undefined>>, R2>(
  schema: Schema.Schema<P, I, R2>
) => <
  Id extends ApiEndpoint.AnyId,
  B,
  _,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, ApiRequest.ApiRequest<B, _, Q, H, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> = internal.setRequestPath

/**
 * @category modifications
 * @since 1.0.0
 */
export const setRequestQuery: <Q, I extends Readonly<Record<string, string | undefined | ReadonlyArray<string>>>, R2>(
  schema: Schema.Schema<Q, I, R2>
) => <
  Id extends ApiEndpoint.AnyId,
  B,
  P,
  _,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, _, H, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> = internal.setRequestQuery

/**
 * @category modifications
 * @since 1.0.0
 */
export const setRequestHeaders: <H, I extends Readonly<Record<string, string | undefined>>, R2>(
  schema: Schema.Schema<H, I, R2>
) => <
  Id extends ApiEndpoint.AnyId,
  B,
  P,
  Q,
  _,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, _, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> = internal.setRequestHeaders

/**
 * @category modifications
 * @since 1.0.0
 */
export const setSecurity: <Security extends Security.Security.Any>(security: Security) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  _ extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, _>) => ApiEndpoint<Id, Request, Response, Security> =
  internal.setSecurity

/**
 * @category modifications
 * @since 1.0.0
 */
export const setOptions: (options: Partial<Options>) => <A extends ApiEndpoint.Any>(endpoint: A) => A =
  internal.setOptions

/**
 * @category modifications
 * @since 1.0.0
 */
export const getId: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => Id = internal.getId

/**
 * @category getters
 * @since 1.0.0
 */
export const getRequest: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => Request = internal.getRequest

/**
 * @category getters
 * @since 1.0.0
 */
export const getResponse: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => ReadonlyArray<Response> = internal.getResponse

/**
 * @category getters
 * @since 1.0.0
 */
export const getSecurity: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => Security = internal.getSecurity

/**
 * @category getters
 * @since 1.0.0
 */
export const getPath: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => HttpRouter.PathInput = internal.getPath

/**
 * @category getters
 * @since 1.0.0
 */
export const getMethod: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => HttpMethod.HttpMethod = internal.getMethod

/**
 * @category getters
 * @since 1.0.0
 */
export const getOptions: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(endpoint: ApiEndpoint<Id, Request, Response, Security>) => Options = internal.getOptions

/**
 * @category getters
 * @since 1.0.0
 */
export const setResponse: <
  Status extends ApiResponse.ApiResponse.AnyStatus,
  Body = ApiSchema.Ignored,
  Headers = ApiSchema.Ignored,
  R = never
>(
  response: {
    readonly status: Status
    readonly body?: Schema.Schema<Body, any, R>
    readonly headers?: Schema.Schema<Headers, any, R>
  } | ApiResponse.ApiResponse<Status, Body, Headers, R>
) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  _ extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, _, Security>
) => ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, Body, Headers, R>, Security> = internal.setResponse

/**
 * @category modifications
 * @since 1.0.0
 */
export const setResponseStatus: <Status extends ApiResponse.ApiResponse.AnyStatus>(
  status: Status
) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  _ extends ApiResponse.ApiResponse.AnyStatus,
  B,
  H,
  R,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, ApiResponse.ApiResponse<_, B, H, R>, Security>
) => ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, B, H, R>, Security> = internal.setResponseStatus

/**
 * @category modifications
 * @since 1.0.0
 */
export const setResponseBody: <B, R2>(
  schema: Schema.Schema<B, any, R2>
) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  S extends ApiResponse.ApiResponse.AnyStatus,
  _,
  H,
  R1,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, _, H, R1>, Security>
) => ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, H, R1 | R2>, Security> = internal.setResponseBody

/**
 * @category modifications
 * @since 1.0.0
 */
export const setResponseHeaders: <H, R2>(
  schema: Schema.Schema<H, any, R2>
) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  S extends ApiResponse.ApiResponse.AnyStatus,
  B,
  _,
  R1,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, _, R1>, Security>
) => ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, H, R1 | R2>, Security> = internal.setResponseHeaders

/**
 * @category modifications
 * @since 1.0.0
 */
export const addResponse: <
  Status extends ApiResponse.ApiResponse.AnyStatus,
  Body = ApiSchema.Ignored,
  Headers = ApiSchema.Ignored,
  R = never
>(
  response: ApiResponse.ApiResponse<Status, Body, Headers, R> | {
    readonly status: Status
    readonly body?: Schema.Schema<Body, any, R>
    readonly headers?: Schema.Schema<Headers, any, R>
  }
) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint<Id, Request, Response1 | ApiResponse.ApiResponse<Status, Body, Headers, R>, Security> =
  internal.addResponse

/**
 * @category modifications
 * @since 1.0.0
 */
export const setResponseRepresentations: (
  representations: Array.NonEmptyReadonlyArray<Representation.Representation>
) => <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, Response, Security>
) => ApiEndpoint<Id, Request, Response, Security> = internal.setResponseRepresentations

/**
 * Is used by the client and server implementation to determine whether
 * to use a full `{ status; body; headers }` response or just the body.
 *
 * The logic is that if there is only one declared response and it doesn't
 * specify any headers, the simplified version with body only is used, otherwise
 * the full response is used.
 *
 * @category getters
 * @since 1.0.0
 */
export const isFullResponse: <
  Id extends ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, Response, Security>
) => boolean = internal.isFullResponse

/**
 * @category refinements
 * @since 1.0.0
 */
export const isApiEndpoint: (u: unknown) => u is ApiEndpoint.Any = internal.isApiEndpoint
