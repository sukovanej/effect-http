/**
 * `Api` represents the API specification. It doesn't hold information concerning the
 * server or client side details. An instance of `Api` can be used to derive a client
 * implementation (see `Client.ts`).
 *
 * The generated type of the `Api` is used during server implementation. The type safety
 * guarantees the server-side implementation and the `Api` specification are compatible.
 *
 * @since 1.0.0
 */
import type * as PlatformRouter from "@effect/platform/Http/Router"
import type * as Schema from "@effect/schema/Schema"
import type { ReadonlyRecord } from "effect"
import type * as Pipeable from "effect/Pipeable"
import type * as ReadonlyArray from "effect/ReadonlyArray"
import type * as Types from "effect/Types"
import type { OpenApiTypes } from "schema-openapi"

import * as internal from "./internal/api.js"
import type * as Representation from "./Representation.js"
import type * as SecurityScheme from "./SecurityScheme.js"

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
 * @since 1.0.0
 * @category type id
 */
export const ApiGroupTypeId: unique symbol = internal.ApiGroupTypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type ApiGroupTypeId = typeof ApiGroupTypeId

/**
 * @category models
 * @since 1.0.0
 */
export interface Api<E extends Endpoint = Endpoint> extends Pipeable.Pipeable {
  [ApiTypeId]: ApiTypeId
  groups: Array<ApiGroup<E>>
  options: {
    title: string
    version: string
    description?: string
    servers?: ReadonlyArray<OpenApiTypes.OpenAPISpecServer | string>
    license?: {
      name: string
      url?: string
    }
  }
}

/** @ignore */
export type ApiRequirements<S extends Api> = EndpointRequirements<S["groups"][number]["endpoints"][number]>

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiGroup<E extends Endpoint = Endpoint> extends Pipeable.Pipeable {
  [ApiGroupTypeId]: ApiGroupTypeId
  endpoints: Array<E>
  options: {
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url: string
    }
  }
}

/**
 * @category models
 * @since 1.0.0
 */
export type Method =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "head"
  | "patch"
  | "options"

/**
 * @category models
 * @since 1.0.0
 */
export interface Endpoint {
  id: string
  path: PlatformRouter.PathInput
  method: Method
  schemas: EndpointSchemas
  options: EndpointOptions
  security: ReadonlyRecord.ReadonlyRecord<SecurityScheme.SecurityScheme<any>>
}

/** @ignore */
type EndpointAllSchema<E extends Endpoint> =
  | E["schemas"]["request"][keyof Endpoint["schemas"]["request"]]
  | EndpointResponseAllSchemas<E["schemas"]["response"]>

/** @ignore */
type EndpointResponseAllSchemas<R extends EndpointSchemas["response"]> = R extends Schema.Schema<any, any, any> ? R
  : R extends ResponseSchemaFull ? R[keyof ResponseSchemaFull]
  : R extends ReadonlyArray<ResponseSchemaFull> ? R[number][keyof ResponseSchemaFull]
  : never

/** @ignore */
type FilterSchemas<X> = X extends Schema.Schema<any, any, infer R> ? R : never

/** @ignore */
export type EndpointRequirements<E extends Endpoint> = FilterSchemas<EndpointAllSchema<E>>

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointSchemas {
  response:
    | Schema.Schema<any, any, any>
    | ResponseSchemaFull
    | ReadonlyArray<ResponseSchemaFull>
  request: {
    query: Schema.Schema<any, any, any> | IgnoredSchemaId
    params: Schema.Schema<any, any, any> | IgnoredSchemaId
    body: Schema.Schema<any, any, any> | IgnoredSchemaId
    headers: Schema.Schema<any, any, any> | IgnoredSchemaId
  }
}

/**
 * @category refinements
 * @since 1.0.0
 */
export const isApi: (u: unknown) => u is Api<any> = internal.isApi

/**
 * @category refinements
 * @since 1.0.0
 */
export const isApiGroup: (u: unknown) => u is ApiGroup<any> = internal.isApiGroup

/**
 * @category models
 * @since 1.0.0
 */
export interface InputEndpointSchemas {
  response:
    | InputResponseSchemaFull
    | ReadonlyArray<InputResponseSchemaFull>
    | Schema.Schema<any, any>
  request?: {
    query?: Schema.Schema<any, any>
    params?: Schema.Schema<any, any>
    body?: Schema.Schema<any, any>
    headers?: Schema.Schema<any, any>
  }
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const api: (options?: Partial<Api["options"]>) => Api<never> = internal.api

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointOptions {
  description?: string
  summary?: string
  deprecated?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
type EndpointSetter = <
  const Id extends string,
  const Schemas extends InputEndpointSchemas,
  const Security extends ReadonlyRecord.ReadonlyRecord<SecurityScheme.SecurityScheme<any>> | undefined = undefined
>(
  id: Id,
  path: PlatformRouter.PathInput,
  schemas: Schemas,
  options?: EndpointOptions,
  security?: Security
) => <A extends Api | ApiGroup>(api: A) => AddEndpoint<A, Id, Schemas, Security>

/**
 * @category methods
 * @since 1.0.0
 */
export const get: EndpointSetter = internal.endpoint("get")

/**
 * @category methods
 * @since 1.0.0
 */
export const post: EndpointSetter = internal.endpoint("post")

/**
 * @category methods
 * @since 1.0.0
 */
export const put: EndpointSetter = internal.endpoint("put")

/**
 * @category methods
 * @since 1.0.0
 */
export const head: EndpointSetter = internal.endpoint("head")

/**
 * @category methods
 * @since 1.0.0
 */
export const patch: EndpointSetter = internal.endpoint("patch")

const _delete: EndpointSetter = internal.endpoint("delete")

export {
  /**
   * @category methods
   * @since 1.0.0
   */
  _delete as delete
}

/**
 * @category methods
 * @since 1.0.0
 */
export const options: EndpointSetter = internal.endpoint("options")

/**
 * Create new API group with a given name
 *
 * @category constructors
 * @since 1.0.0
 */
export const apiGroup: (name: string, options?: Omit<ApiGroup["options"], "name">) => ApiGroup<never> =
  internal.apiGroup

/**
 * Merge the Api `Group` with an `Api`
 *
 * @category combinators
 * @since 1.0.0
 */
export const addGroup: <E2 extends Endpoint>(
  apiGroup: ApiGroup<E2>
) => <E1 extends Endpoint>(api: Api<E1>) => Api<E1 | E2> = internal.addGroup

/**
 * @category utils
 * @since 1.0.0
 */
export const getEndpoint: <
  A extends Api,
  Id extends A["groups"][number]["endpoints"][number]["id"]
>(
  api: A,
  id: Id
) => Extract<A["groups"][number]["endpoints"][number], { id: Id }> = internal.getEndpoint

/**
 * FormData schema
 *
 * @category schemas
 * @since 1.0.0
 */
export const FormData: Schema.Schema<FormData> = internal.formDataSchema

// Internal type helpers

/** @ignore */
export const IgnoredSchemaId: unique symbol = internal.IgnoredSchemaId

/** @ignore */
export type IgnoredSchemaId = typeof IgnoredSchemaId

/** @ignore */
type ResponseSchemaFromInput<S extends InputEndpointSchemas["response"]> = S extends Schema.Schema<any, any> ? S
  : S extends ReadonlyArray<InputResponseSchemaFull> ? ComputeEndpointResponseFull<S>
  : S extends InputResponseSchemaFull ? ResponseSchemaFullFromInput<S>
  : never

/** @ignore */
type GetOptional<
  A extends Record<string, unknown> | undefined,
  K extends keyof Exclude<A, undefined>
> = A extends Record<string, unknown> ? K extends keyof A ? A[K]
  : undefined
  : undefined

/** @ignore */
export type CreateEndpointSchemasFromInput<I extends InputEndpointSchemas> = Types.Simplify<{
  response: ResponseSchemaFromInput<I["response"]>
  request: {
    query: UndefinedToIgnoredSchema<GetOptional<I["request"], "query">>
    params: UndefinedToIgnoredSchema<GetOptional<I["request"], "params">>
    body: UndefinedToIgnoredSchema<GetOptional<I["request"], "body">>
    headers: UndefinedToIgnoredSchemaLowercased<
      GetOptional<I["request"], "headers">
    >
  }
}>

/** @ignore */
type UndefinedToIgnoredSchema<S extends unknown | undefined> = S extends Schema.Schema<any, any> ? S : IgnoredSchemaId

/** @ignore */
type UndefinedToIgnoredSchemaLowercased<S extends unknown | undefined> = S extends
  Schema.Schema<infer O, infer I, infer R>
  ? O extends Record<string, any>
    ? I extends Record<string, any> ? Schema.Schema<LowercaseFields<O>, LowercaseFields<I>, R>
    : never
  : never
  : IgnoredSchemaId

/** @ignore */
type LowercaseFields<A extends Record<string, unknown>> = Types.Simplify<
  {
    [K in keyof A as K extends string ? Lowercase<K> : never]: A[K]
  }
>

/** @ignore */
export type ComputeEndpointResponseFull<
  Rs extends ReadonlyArray<InputResponseSchemaFull>
> = Rs extends readonly [infer R, ...infer Rest]
  ? R extends InputResponseSchemaFull
    ? Rest extends ReadonlyArray<InputResponseSchemaFull>
      ? [ResponseSchemaFullFromInput<R>, ...ComputeEndpointResponseFull<Rest>]
    : never
  : never
  : []

/** @ignore */
type ResponseSchemaFullFromInput<R extends InputResponseSchemaFull> = {
  status: R["status"]
  content: UndefinedToIgnoredSchema<R["content"]>
  headers: UndefinedToIgnoredSchemaLowercased<R["headers"]>
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
}

/** @ignore */
export interface ResponseSchemaFull {
  status: number
  content: Schema.Schema<any, any, any> | IgnoredSchemaId
  headers: Schema.Schema<any, any, any> | IgnoredSchemaId
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
}

/** @ignore */
export interface InputResponseSchemaFull {
  status: number
  content?: Schema.Schema<any, any, any>
  headers?: Schema.Schema<any, any, any>
  representations?: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>
}

/** @ignore */
export type AddEndpoint<
  A extends Api | ApiGroup,
  Id extends string,
  Schemas extends InputEndpointSchemas,
  Security extends ReadonlyRecord.ReadonlyRecord<SecurityScheme.SecurityScheme<any>> | undefined
> = A extends Api<infer E> ? Api<E | Types.Simplify<CreateEndpointFromInput<Id, Schemas, Security>>>
  : A extends ApiGroup<infer E> ? ApiGroup<E | Types.Simplify<CreateEndpointFromInput<Id, Schemas, Security>>>
  : never

/** @ignore */
type CreateEndpointFromInput<
  Id extends string,
  Schemas extends InputEndpointSchemas,
  Security extends ReadonlyRecord.ReadonlyRecord<SecurityScheme.SecurityScheme<any>> | undefined
> = {
  id: Id
  security: [Security] extends [infer X extends ReadonlyRecord.ReadonlyRecord<any>] ? X : {}
  schemas: CreateEndpointSchemasFromInput<Schemas>
  path: PlatformRouter.PathInput
  method: Method
  options: {
    groupName: string
    description?: string
    summary?: string
  }
}
