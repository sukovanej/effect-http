/**
 * Create @effect/platform/Http/Router `Router`
 *
 * @since 1.0.0
 */
import type * as Router from "@effect/platform/Http/Router"
import type * as ParseResult from "@effect/schema/ParseResult"
import type * as Schema from "@effect/schema/Schema"
import type * as Effect from "effect/Effect"
import type * as Either from "effect/Either"
import type * as Types from "effect/Types"

import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiRequest from "./ApiRequest.js"
import type * as ApiResponse from "./ApiResponse.js"
import type * as ApiSchema from "./ApiSchema.js"
import * as internal from "./internal/route.js"
import type * as utils from "./internal/utils.js"
import type * as RouterBuilder from "./RouterBuilder.js"
import type * as SecurityScheme from "./SecurityScheme.js"
import type * as ServerError from "./ServerError.js"

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerFunction<Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E> = (
  request: ToRequest<ApiEndpoint.ApiEndpoint.Request<Endpoint>>,
  security: ToSecurity<ApiEndpoint.ApiEndpoint.Security<Endpoint>>
) => Effect.Effect<
  ToResponse<ApiEndpoint.ApiEndpoint.Response<Endpoint>>,
  E,
  R
>

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromEndpoint: <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  fn: HandlerFunction<Endpoint, R, E>,
  options?: Partial<RouterBuilder.Options>
) => (
  endpoint: Endpoint
) => Router.Route<R, Exclude<E, ServerError.ServerError>> = internal.fromEndpoint

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any, Id extends Api.Api.Ids<A>, R, E>(
  id: Id,
  fn: HandlerFunction<Api.Api.EndpointById<A, Id>, R, E>,
  options?: Partial<RouterBuilder.Options>
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>> = internal.make

/** @ignore */
type ToResponse<
  R extends ApiResponse.ApiResponse.Any
> = utils.IsUnion<R> extends true ? R extends any ? ToFullResponse<R> : never
  : NeedsFullResponse<R> extends true ? ToFullResponse<R>
  : IgnoredToVoid<ApiResponse.ApiResponse.Body<R>>

type IgnoredToVoid<R> = R extends ApiSchema.Ignored ? void : R

/** @ignore */
type NeedsFullResponse<R extends ApiResponse.ApiResponse.Any> = ApiResponse.ApiResponse.Headers<R> extends
  ApiSchema.Ignored ? false : true

/** @ignore */
export type ToFullResponse<R extends ApiResponse.ApiResponse.Any> = R extends any ?
  `${ApiResponse.ApiResponse.Status<R>}` extends `${1 | 2}${string}` ? Types.Simplify<
      utils.RemoveIgnoredFields<
        {
          readonly status: ApiResponse.ApiResponse.Status<R>
          readonly body: ApiResponse.ApiResponse.Body<R>
          readonly headers: ApiResponse.ApiResponse.Headers<R>
        }
      >
    >
  : never
  : never

/** @ignore */
export type ToRequest<R extends ApiRequest.ApiRequest.Any> = utils.RemoveIgnoredFields<{
  readonly body: ApiRequest.ApiRequest.Body<R>
  readonly path: ApiRequest.ApiRequest.Path<R>
  readonly query: ApiRequest.ApiRequest.Query<R>
  readonly headers: ApiRequest.ApiRequest.Headers<R>
}>

/** @ignore */
export type ToSecurity<Security extends ApiEndpoint.ApiSecurity.Any> = Types.Simplify<
  {
    [K in keyof Security]: Security[K] extends infer SS extends SecurityScheme.HTTPSecurityScheme<any> ? {
        readonly token: [utils.IsUnion<keyof Security>] extends [true]
          ? Either.Either<Schema.Schema.Type<SS["schema"]>, ParseResult.ParseError>
          : Schema.Schema.Type<SS["schema"]>
        readonly securityScheme: SS
      } :
      never
  }
>
