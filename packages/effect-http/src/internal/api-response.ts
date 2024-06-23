import type * as Schema from "@effect/schema/Schema"
import type * as Array from "effect/Array"
import * as Pipeable from "effect/Pipeable"
import * as Predicate from "effect/Predicate"

import type * as ApiResponse from "../ApiResponse.js"
import * as ApiSchema from "../ApiSchema.js"
import * as Representation from "../Representation.js"

/** @internal */
export const TypeId: ApiResponse.TypeId = Symbol.for(
  "effect-http/Api/ResponseTypeId"
) as ApiResponse.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _S: (_: any) => _,
  /* c8 ignore next */
  _B: (_: any) => _,
  /* c8 ignore next */
  _H: (_: any) => _,
  /* c8 ignore next */
  _R: (_: never) => _
}

/** @internal */
class ApiResponseImpl<S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>
  implements ApiResponse.ApiResponse<S, B, H, R>
{
  readonly [TypeId] = variance

  constructor(
    readonly status: S,
    readonly body: Schema.Schema<B, any, R> | ApiSchema.Ignored,
    readonly headers: Schema.Schema<H, any, R> | ApiSchema.Ignored,
    readonly representations: Array.NonEmptyReadonlyArray<Representation.Representation>
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
const defaultRepresentations = [Representation.json] as const

/** @internal */
export const defaultResponse: ApiResponse.ApiResponse.Default = new ApiResponseImpl(
  200,
  ApiSchema.Ignored,
  ApiSchema.Ignored,
  defaultRepresentations
)

/** @internal */
export const isApiResponse = <S extends ApiResponse.ApiResponse.AnyStatus = number, B = any, H = any, R = never>(
  u: unknown
): u is ApiResponse.ApiResponse<S, B, H, R> => Predicate.hasProperty(u, TypeId) && Predicate.isObject(u[TypeId])

/** @internal */
export const make = <S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
  status: S,
  body?: Schema.Schema<B, any, R> | ApiSchema.Ignored,
  headers?: Schema.Schema<H, any, R> | ApiSchema.Ignored,
  representations?: Array.NonEmptyReadonlyArray<Representation.Representation>
): ApiResponse.ApiResponse<S, B, H, R> =>
  new ApiResponseImpl<S, B, H, R>(
    status,
    body ?? ApiSchema.Ignored,
    headers ?? ApiSchema.Ignored,
    representations ?? defaultRepresentations
  )

/** @internal */
export const setStatus =
  <S extends ApiResponse.ApiResponse.AnyStatus>(status: S) =>
  <_ extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
    response: ApiResponse.ApiResponse<_, B, H, R>
  ): ApiResponse.ApiResponse<S, B, H, R> =>
    make<S, B, H, R>(status, getBodySchema(response), getHeadersSchema(response), getRepresentations(response))

/** @internal */
export const setBody =
  <B, R2>(schema: Schema.Schema<B, any, R2>) =>
  <S extends ApiResponse.ApiResponse.AnyStatus, _, H, R1>(
    response: ApiResponse.ApiResponse<S, _, H, R1>
  ): ApiResponse.ApiResponse<S, B, H, R1 | R2> =>
    make<S, B, H, R1 | R2>(getStatus(response), schema, getHeadersSchema(response), getRepresentations(response))

/** @internal */
export const setHeaders =
  <H, R2>(schema: Schema.Schema<H, any, R2>) =>
  <S extends ApiResponse.ApiResponse.AnyStatus, B, _, R1>(
    response: ApiResponse.ApiResponse<S, B, _, R1>
  ): ApiResponse.ApiResponse<S, B, H, R1 | R2> =>
    make<S, B, H, R1 | R2>(
      getStatus(response),
      getBodySchema(response),
      schema,
      getRepresentations(response)
    )

/** @internal */
export const setRepresentations =
  (representations: Array.NonEmptyReadonlyArray<Representation.Representation>) =>
  <S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
    response: ApiResponse.ApiResponse<S, B, H, R>
  ): ApiResponse.ApiResponse<S, B, H, R> =>
    make<S, B, H, R>(getStatus(response), getBodySchema(response), getHeadersSchema(response), representations)

/** @internal */
export const getStatus = <S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse.ApiResponse<S, B, H, R>
): S => (response as ApiResponseImpl<S, B, H, R>).status

/** @internal */
export const getHeadersSchema = <S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse.ApiResponse<S, B, H, R>
): Schema.Schema<H, any, R> | ApiSchema.Ignored => (response as ApiResponseImpl<S, B, H, R>).headers

/** @internal */
export const getBodySchema = <S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse.ApiResponse<S, B, H, R>
): Schema.Schema<B, any, R> | ApiSchema.Ignored => (response as ApiResponseImpl<S, B, H, R>).body

/** @internal */
export const getRepresentations = <S extends ApiResponse.ApiResponse.AnyStatus, B, H, R>(
  response: ApiResponse.ApiResponse<S, B, H, R>
) => (response as ApiResponseImpl<S, B, H, R>).representations
