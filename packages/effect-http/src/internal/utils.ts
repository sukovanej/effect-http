import * as Schema from "@effect/schema/Schema"
import { ApiResponse } from "effect-http"
import type * as Types from "effect/Types"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiSchema from "../ApiSchema.js"

/** @internal */
export const getSchema = <A = Schema.Schema<any, any>>(
  input: Schema.Schema<any, any, unknown> | ApiSchema.Ignored,
  defaultSchema: Schema.Schema<any, any> | A = Schema.unknown
) => (ApiSchema.isIgnored(input) ? defaultSchema : input)

/** @internal */
export const createResponseSchema = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
) => {
  const response = ApiEndpoint.getResponse(endpoint)
  const isFullResponse = ApiEndpoint.isFullResponse(endpoint)

  if (!isFullResponse && ApiSchema.isIgnored(ApiResponse.getBodySchema(response[0]))) {
    return undefined
  }

  if (!isFullResponse) {
    return getSchema(ApiResponse.getBodySchema(response[0]))
  }

  return Schema.union(
    ...response.map(
      (response) =>
        Schema.struct({
          status: Schema.literal(ApiResponse.getStatus(response)),
          body: getSchema(ApiResponse.getBodySchema(response)),
          headers: getSchema(
            ApiResponse.getHeadersSchema(response),
            Schema.record(Schema.string, Schema.string)
          )
        })
    )
  )
}

export type SchemaTo<S> = S extends Schema.Schema<infer A, any, any> ? A : never

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

/**
 * type X = IsUnion<"a" | "b" | "c">  => true
 * type X = IsUnion<"a" | "b">        => true
 * type X = IsUnion<"a">              => false
 */
export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true

export type RemoveIgnoredFields<E> = Types.Simplify<
  {
    [K in keyof E as E[K] extends ApiSchema.Ignored ? never : K]: E[K]
  }
>

export type FilterNon200Responses<R extends ApiResponse.ApiResponse.Any> = R extends any ?
  `${ApiResponse.ApiResponse.Status<R>}` extends `2${string}` ? R : never :
  never

export type NeedsFullResponse<R extends ApiResponse.ApiResponse.Any> = ApiResponse.ApiResponse.Headers<R> extends
  ApiSchema.Ignored ? false : true

export type IgnoredToVoid<R> = R extends ApiSchema.Ignored ? void : R
