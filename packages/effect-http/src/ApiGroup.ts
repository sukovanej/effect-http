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
 * @since 1.0.0
 */
export declare namespace ApiGroup {
  /**
   * Any api group with `Endpoint = Endpoint.Any`.
   *
   * @since 1.0.0
   */
  export type Any = ApiGroup<ApiEndpoint.ApiEndpoint.Any>

  /**
   * Default api group spec.
   *
   * @since 1.0.0
   */
  export type Empty = ApiGroup<never>

  /**
   * @since 1.0.0
   */
  export type Requirements<Endpoint> = Endpoint extends ApiGroup<infer E> ? ApiEndpoint.ApiEndpoint.Requirements<E>
    : never
}

/**
 * @since 1.0.0
 */
export const make: (
  name: string,
  options?: Partial<Options>
) => ApiGroup.Empty = internal.make

/**
 * @since 1.0.0
 */
export const addEndpoint: <E2 extends ApiEndpoint.ApiEndpoint.Any>(
  endpoint: E2
) => <E1 extends ApiEndpoint.ApiEndpoint.Any>(api: ApiGroup<E1>) => ApiGroup<E1 | E2> = internal.addEndpoint

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
