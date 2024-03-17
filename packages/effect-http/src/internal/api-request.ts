import type * as Schema from "@effect/schema/Schema"
import * as Pipeable from "effect/Pipeable"
import type * as ApiRequest from "../ApiRequest.js"
import * as ApiSchema from "../ApiSchema.js"

export const TypeId: ApiRequest.TypeId = Symbol.for(
  "effect-http/Api/RequestTypeId"
) as ApiRequest.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _B: (_: any) => _,
  /* c8 ignore next */
  _P: (_: any) => _,
  /* c8 ignore next */
  _Q: (_: any) => _,
  /* c8 ignore next */
  _H: (_: any) => _,
  /* c8 ignore next */
  _R: (_: never) => _
}

/** @internal */
export class ApiRequestImpl<B, P, Q, H, R> implements ApiRequest.ApiRequest<B, P, Q, H, R> {
  readonly [TypeId] = variance

  constructor(
    readonly body: Schema.Schema<B, any, R> | ApiSchema.Ignored,
    readonly path: Schema.Schema<P, any, R> | ApiSchema.Ignored,
    readonly query: Schema.Schema<Q, any, R> | ApiSchema.Ignored,
    readonly headers: Schema.Schema<H, any, R> | ApiSchema.Ignored
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const defaultRequest: ApiRequest.ApiRequest.Default = new ApiRequestImpl(
  ApiSchema.Ignored,
  ApiSchema.Ignored,
  ApiSchema.Ignored,
  ApiSchema.Ignored
)

/** @internal */
export const getBodySchema = <B, P, Q, H, R>(
  request: ApiRequest.ApiRequest<B, P, Q, H, R>
): Schema.Schema<B, any, R> | ApiSchema.Ignored => (request as ApiRequestImpl<B, P, Q, H, R>).body

/** @internal */
export const getPathSchema = <B, P, Q, H, R>(
  request: ApiRequest.ApiRequest<B, P, Q, H, R>
): Schema.Schema<P, any, R> | ApiSchema.Ignored => (request as ApiRequestImpl<B, P, Q, H, R>).path

/** @internal */
export const getQuerySchema = <B, P, Q, H, R>(
  request: ApiRequest.ApiRequest<B, P, Q, H, R>
): Schema.Schema<Q, any, R> | ApiSchema.Ignored => (request as ApiRequestImpl<B, P, Q, H, R>).query

/** @internal */
export const getHeadersSchema = <B, P, Q, H, R>(
  request: ApiRequest.ApiRequest<B, P, Q, H, R>
): Schema.Schema<H, any, R> | ApiSchema.Ignored => (request as ApiRequestImpl<B, P, Q, H, R>).headers

/** @internal */
export const setBody =
  <B, R2>(schema: Schema.Schema<B, any, R2>) =>
  <_, P, Q, H, R1>(request: ApiRequest.ApiRequest<_, P, Q, H, R1>): ApiRequest.ApiRequest<B, P, Q, H, R1 | R2> =>
    new ApiRequestImpl<B, P, Q, H, R1 | R2>(
      schema,
      getPathSchema(request),
      getQuerySchema(request),
      getHeadersSchema(request)
    )

/** @internal */
export const setPath = <P, R2>(schema: Schema.Schema<P, any, R2>) =>
<B, _, Q, H, R1>(
  request: ApiRequest.ApiRequest<B, _, Q, H, R1>
): ApiRequest.ApiRequest<B, P, Q, H, R1 | R2> =>
  new ApiRequestImpl<B, P, Q, H, R1 | R2>(
    getBodySchema(request),
    schema,
    getQuerySchema(request),
    getHeadersSchema(request)
  )

/** @internal */
export const setQuery =
  <Q, R2>(schema: Schema.Schema<Q, any, R2>) =>
  <B, P, _, H, R1>(request: ApiRequest.ApiRequest<B, P, _, H, R1>): ApiRequest.ApiRequest<B, P, Q, H, R1 | R2> =>
    new ApiRequestImpl<B, P, Q, H, R1 | R2>(
      getBodySchema(request),
      getPathSchema(request),
      schema,
      getHeadersSchema(request)
    )

/** @internal */
export const setHeaders = <H, R2>(schema: Schema.Schema<H, any, R2>) =>
<B, P, Q, _, R1>(
  request: ApiRequest.ApiRequest<B, P, Q, _, R1>
): ApiRequest.ApiRequest<B, P, Q, H, R1 | R2> =>
  new ApiRequestImpl<B, P, Q, H, R1 | R2>(
    getBodySchema(request),
    getPathSchema(request),
    getQuerySchema(request),
    schema // TODO: transform schema properties to lowercase
  )
