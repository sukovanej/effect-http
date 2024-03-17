/**
 * HTTP API service declaration.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import type * as Pipeable from "effect/Pipeable"
import type * as OpenApiTypes from "schema-openapi/OpenApiTypes"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as ApiGroup from "./ApiGroup.js"
import * as ApiSchema from "./ApiSchema.js"
import * as internal from "./internal/api.js"

/**
 * @since 1.0.0
 * @category type id
 */
export const ApiTypeId: unique symbol = internal.ApiTypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type ApiTypeId = typeof ApiTypeId

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiOptions {
  readonly title: string
  readonly version: string
  readonly description?: string
  readonly servers?: ReadonlyArray<OpenApiTypes.OpenAPISpecServer | string>
  readonly license?: {
    readonly name: string
    readonly url?: string
  }
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Api<E extends ApiEndpoint.ApiEndpoint.Any> extends Pipeable.Pipeable {
  readonly groups: ReadonlyArray<ApiGroup.ApiGroup<E>>
  readonly options: ApiOptions
}

/**
 * @since 1.0.0
 */
export declare namespace Api {
  /**
   * Any api with `Endpoint = Endpoint.Any`
   *
   * @since 1.0.0
   */
  export type Any = Api<ApiEndpoint.ApiEndpoint.Any>

  /**
   * Default api group spec.
   *
   * @since 1.0.0
   */
  export type Empty = Api<never>

  /**
   * @since 1.0.0
   */
  export type Requirements<A> = A extends Api<infer E> ? ApiEndpoint.ApiEndpoint.Requirements<E>
    : never

  /**
   * @since 1.0.0
   */
  export type Endpoints<A extends Any> = [A] extends [Api<infer E>] ? E
    : never

  /**
   * @since 1.0.0
   */
  export type EndpointById<A extends Any, Id extends ApiEndpoint.ApiEndpoint.AnyId> = [A] extends [Api<infer E>]
    ? E extends ApiEndpoint.ApiEndpoint<Id, any, any, any> ? E : never
    : never

  /**
   * @since 1.0.0
   */
  export type Ids<A extends Any> = [Endpoints<A>] extends [ApiEndpoint.ApiEndpoint<infer Id, any, any, any>] ? Id
    : never
}

/**
 * @category api
 * @since 1.0.0
 */
export const make: (options?: Partial<ApiOptions>) => Api.Empty = internal.make

/**
 * @since 1.0.0
 */
export const addEndpoint: <E2 extends ApiEndpoint.ApiEndpoint.Any>(
  endpoint: E2
) => <E1 extends ApiEndpoint.ApiEndpoint.Any>(api: Api<E1>) => Api<E1 | E2> = internal.addEndpoint

/**
 * @since 1.0.0
 */
export const addGroup: <E2 extends ApiEndpoint.ApiEndpoint.Any>(
  group: ApiGroup.ApiGroup<E2>
) => <E1 extends ApiEndpoint.ApiEndpoint.Any>(api: Api<E1>) => Api<E1 | E2> = internal.addGroup

/**
 * @since 1.0.0
 */
export const getEndpoint: <A extends Api.Any, Id extends Api.Ids<A>>(api: A, id: Id) => Api.EndpointById<A, Id> =
  internal.getEndpoint

export {
  /**
   * @category reexported
   * @since 1.0.0
   */
  addResponse,
  /**
   * @category reexported
   * @since 1.0.0
   */
  addSecurity,
  /**
   * @category reexported
   * @since 1.0.0
   */
  delete,
  /**
   * @category reexported
   * @since 1.0.0
   */
  get,
  /**
   * @category reexported
   * @since 1.0.0
   */
  make as endpoint,
  /**
   * @category reexported
   * @since 1.0.0
   */
  patch,
  /**
   * @category reexported
   * @since 1.0.0
   */
  post,
  /**
   * @category reexported
   * @since 1.0.0
   */
  put,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setRequest,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setRequestBody,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setRequestHeaders,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setRequestPath,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setRequestQuery,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setResponse,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setResponseBody,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setResponseHeaders,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setResponseRepresentations,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setResponseStatus,
  /**
   * @category reexported
   * @since 1.0.0
   */
  setSecurity
  /**
   * @category reexported
   * @since 1.0.0
   */
} from "./ApiEndpoint.js"

/**
 * FormData schema
 *
 * @category schemas
 * @since 1.0.0
 */
export const FormData: Schema.Schema<FormData> = ApiSchema.FormData
