/**
 * Api groups.
 *
 * @since 1.0.0
 */
import type * as Pipeable from "effect/Pipeable"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import * as internal from "./internal/api-group.js"

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
  readonly description?: string
  readonly externalDocs?: {
    readonly description?: string
    readonly url: string
  }
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiGroup<E extends ApiEndpoint.ApiEndpoint.Any> extends Pipeable.Pipeable {
  readonly name: string
  readonly endpoints: ReadonlyArray<E>
  readonly options: Options
}

/**
 * @category models
 * @since 1.0.0
 */
export declare namespace ApiGroup {
  /**
   * Any api group with `Endpoint = Endpoint.Any`.
   *
   * @category models
   * @since 1.0.0
   */
  export type Any = ApiGroup<ApiEndpoint.ApiEndpoint.Any>

  /**
   * Default api group spec.
   *
   * @category models
   * @since 1.0.0
   */
  export type Empty = ApiGroup<never>

  /**
   * @category models
   * @since 1.0.0
   */
  export type Context<Endpoint> = Endpoint extends ApiGroup<infer E> ? ApiEndpoint.ApiEndpoint.Context<E>
    : never
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (
  name: string,
  options?: Partial<Options>
) => ApiGroup.Empty = internal.make

/**
 * @category modifications
 * @since 1.0.0
 */
export const addEndpoint: <E2 extends ApiEndpoint.ApiEndpoint.Any>(
  endpoint: E2
) => <E1 extends ApiEndpoint.ApiEndpoint.Any>(api: ApiGroup<E1>) => ApiGroup<E1 | E2> = internal.addEndpoint

export {
  /**
   * @category modifications
   * @since 1.0.0
   */
  addResponse,
  /**
   * @category modifications
   * @since 1.0.0
   */
  addSecurity,
  /**
   * @category constructors
   * @since 1.0.0
   */
  delete,
  /**
   * @category constructors
   * @since 1.0.0
   */
  get,
  /**
   * @category constructors
   * @since 1.0.0
   */
  make as endpoint,
  /**
   * @category constructors
   * @since 1.0.0
   */
  patch,
  /**
   * @category constructors
   * @since 1.0.0
   */
  post,
  /**
   * @category constructors
   * @since 1.0.0
   */
  put,
  /**
   * @category constructors
   * @since 1.0.0
   */
  setRequest,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setRequestBody,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setRequestHeaders,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setRequestPath,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setRequestQuery,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setResponse,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setResponseBody,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setResponseHeaders,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setResponseRepresentations,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setResponseStatus,
  /**
   * @category modifications
   * @since 1.0.0
   */
  setSecurity
  /**
   * @category modifications
   * @since 1.0.0
   */
} from "./ApiEndpoint.js"
