import type * as HttpMethod from "@effect/platform/HttpMethod"
import type * as HttpRouter from "@effect/platform/HttpRouter"
import type * as Schema from "@effect/schema/Schema"
import * as Security from "effect-http-security/Security"
import * as Array from "effect/Array"
import * as Equivalence from "effect/Equivalence"
import { pipe } from "effect/Function"
import * as Order from "effect/Order"
import * as Pipeable from "effect/Pipeable"
import * as Predicate from "effect/Predicate"

import type * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiResponse from "../ApiResponse.js"
import * as ApiSchema from "../ApiSchema.js"
import type * as Representation from "../Representation.js"
import * as api_request from "./api-request.js"
import * as api_response from "./api-response.js"

/** @internal */
export const TypeId: ApiEndpoint.TypeId = Symbol.for(
  "effect-http/Api/EndpointTypeId"
) as ApiEndpoint.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _Id: (_: any) => _,
  /* c8 ignore next */
  _Request: (_: any) => _,
  /* c8 ignore next */
  _Response: (_: any) => _,
  /* c8 ignore next */
  _Security: (_: never) => _
}

/** @internal */
class ApiEndpointImpl<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
> implements ApiEndpoint.ApiEndpoint<Id, Request, Response, Security> {
  readonly [TypeId] = variance

  constructor(
    readonly id: Id,
    readonly path: HttpRouter.PathInput,
    readonly method: HttpMethod.HttpMethod,
    readonly request: Request,
    readonly responses: ReadonlyArray<Response>,
    readonly security: Security,
    readonly options: ApiEndpoint.Options
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const make = <Id extends ApiEndpoint.ApiEndpoint.AnyId>(
  method: HttpMethod.HttpMethod,
  id: Id,
  path: HttpRouter.PathInput,
  options?: Partial<ApiEndpoint.Options>
): ApiEndpoint.ApiEndpoint.Default<Id> =>
  new ApiEndpointImpl(
    id,
    path,
    method,
    api_request.defaultRequest,
    [api_response.defaultResponse],
    Security.unit,
    { ...options }
  )

/** @internal */
export const setRequest = <Request extends ApiRequest.ApiRequest.Any>(
  request: Request
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  _ extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, _, Response, Security>
): ApiEndpoint.ApiEndpoint<Id, Request, Response, Security> =>
  new ApiEndpointImpl(
    getId(endpoint),
    getPath(endpoint),
    getMethod(endpoint),
    request,
    getResponse(endpoint),
    getSecurity(endpoint),
    getOptions(endpoint)
  )

/** @internal */
export const setRequestBody = <B, R2>(
  schema: Schema.Schema<B, any, R2>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  _,
  P,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<_, P, Q, H, R1>, Response, Security>
): ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> => {
  if (getMethod(endpoint) === "GET") {
    throw new Error(`GET ${getPath(endpoint)} (${getId(endpoint)}) cannot have a request body`)
  }

  return setRequest(ApiRequest.setBody(schema)(getRequest(endpoint)))(endpoint)
}

/** @internal */
export const setRequestPath = <P, R2>(
  schema: Schema.Schema<P, any, R2>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  B,
  _,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, _, Q, H, R1>, Response, Security>
): ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> =>
  setRequest(ApiRequest.setPath(schema)(getRequest(endpoint)))(endpoint)

/** @internal */
export const setRequestQuery = <Q, R2>(
  schema: Schema.Schema<Q, any, R2>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  B,
  P,
  _,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, _, H, R1>, Response, Security>
): ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>, Response, Security> =>
  setRequest(ApiRequest.setQuery(schema)(getRequest(endpoint)))(endpoint)

/** @internal */
export const setRequestHeaders = <H, R2>(
  schema: Schema.Schema<H, any, R2>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  B,
  P,
  Q,
  _,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, _, R1>, Response, Security>
): ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<B, P, Q, H, R1 | R2>,
  Response,
  Security
> => setRequest(ApiRequest.setHeaders(schema)(getRequest(endpoint)))(endpoint)

/** @internal */
export const setSecurity = <Security extends Security.Security.Any>(
  security: Security
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  _ extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, _>
): ApiEndpoint.ApiEndpoint<Id, Request, Response, Security> =>
  new ApiEndpointImpl(
    getId(endpoint),
    getPath(endpoint),
    getMethod(endpoint),
    getRequest(endpoint),
    getResponse(endpoint),
    security,
    getOptions(endpoint)
  )

/** @internal */
export const getId = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).id

/** @internal */
export const getRequest = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).request

/** @internal */
export const getResponse = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).responses

/** @internal */
export const getSecurity = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).security

/** @internal */
export const getMethod = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).method

/** @internal */
export const getPath = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).path

/** @internal */
export const getOptions = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => (endpoint as ApiEndpointImpl<Id, Request, Response, Security>).options

/** @internal */
export const setResponse = <
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
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  _ extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, _, Security>
): ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, Body, Headers, R>, Security> => {
  const newResponse = ApiResponse.isApiResponse<Status, Body, Headers, R>(response)
    ? response
    : ApiResponse.make(response.status, response.body, response.headers)

  return new ApiEndpointImpl(
    getId(endpoint),
    getPath(endpoint),
    getMethod(endpoint),
    getRequest(endpoint),
    [newResponse],
    getSecurity(endpoint),
    getOptions(endpoint)
  )
}

/** @internal */
export const setResponseStatus = <Status extends ApiResponse.ApiResponse.AnyStatus>(
  status: Status
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  _ extends ApiResponse.ApiResponse.AnyStatus,
  B,
  H,
  R,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<_, B, H, R>, Security>
): ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, B, H, R>, Security> => {
  const responses = getResponse(endpoint)

  if (responses.length !== 1) {
    throw new Error("Expected exactly one response")
  }

  return setResponse(ApiResponse.setStatus(status)(responses[0]))(endpoint)
}

/** @internal */
export const setResponseBody = <B, R2>(
  schema: Schema.Schema<B, any, R2>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  S extends ApiResponse.ApiResponse.AnyStatus,
  _,
  H,
  R1,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, _, H, R1>, Security>
): ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, H, R1 | R2>, Security> => {
  const responses = getResponse(endpoint)

  if (responses.length !== 1) {
    throw new Error("Expected exactly one response")
  }

  return setResponse(ApiResponse.setBody(schema)(responses[0]))(endpoint)
}

/** @internal */
export const setResponseHeaders = <H, R2>(
  schema: Schema.Schema<H, any, R2>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  S extends ApiResponse.ApiResponse.AnyStatus,
  B,
  _,
  R1,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, _, R1>, Security>
): ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  ApiResponse.ApiResponse<S, B, H, R1 | R2>,
  Security
> => {
  const responses = getResponse(endpoint)

  if (responses.length !== 1) {
    throw new Error("Expected exactly one response")
  }

  return setResponse(ApiResponse.setHeaders(schema)(responses[0]))(endpoint)
}

export const addResponse = <
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
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
): ApiEndpoint.ApiEndpoint<Id, Request, Response1 | ApiResponse.ApiResponse<Status, Body, Headers, R>, Security> => {
  const responses = getResponse(endpoint)
  const newResponse = ApiResponse.isApiResponse<Status, Body, Headers, R>(response)
    ? response
    : ApiResponse.make(response.status, response.body, response.headers)

  if (responses.some((r) => ApiResponse.getStatus(r) === ApiResponse.getStatus(newResponse))) {
    throw new Error(`Status code ${ApiResponse.getStatus(newResponse)} already exists`)
  }

  return new ApiEndpointImpl(
    getId(endpoint),
    getPath(endpoint),
    getMethod(endpoint),
    getRequest(endpoint),
    [...responses, newResponse],
    getSecurity(endpoint),
    getOptions(endpoint)
  )
}

export const setResponseRepresentations = (
  representations: Array.NonEmptyReadonlyArray<Representation.Representation>
) =>
<
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
): ApiEndpoint.ApiEndpoint<Id, Request, Response, Security> => {
  const responses = getResponse(endpoint)

  if (responses.length !== 1) {
    throw new Error("Expected exactly one response")
  }

  return new ApiEndpointImpl(
    getId(endpoint),
    getPath(endpoint),
    getMethod(endpoint),
    getRequest(endpoint),
    [ApiResponse.setRepresentations(representations)(responses[0])],
    getSecurity(endpoint),
    getOptions(endpoint)
  )
}

export const isFullResponse = <
  Id extends ApiEndpoint.ApiEndpoint.AnyId,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => {
  const response = getResponse(endpoint)
  const successResponses = response.filter((response) => ApiResponse.getStatus(response) < 300)
  const hasMultipleSuccessResponses = successResponses.length > 1
  const hasHeaders = !ApiSchema.isIgnored(ApiResponse.getHeadersSchema(response[0]))

  return hasMultipleSuccessResponses || hasHeaders
}

/** @internal */
const getSchemaPropertySignatures = (schema: Schema.Schema<any, any, unknown>) => {
  let ast = schema.ast

  if (ast._tag === "Transformation") {
    ast = ast.from
  }

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Response headers must be a type literal schema`)
  }

  return ast.propertySignatures
}

/** @internal */
const tupleOrder = Order.tuple(Order.string, Order.boolean)

/** @internal */
const tupleEquivalence = Equivalence.tuple(
  Equivalence.string,
  Equivalence.boolean
)

/** @internal */
const arrayOfTupleEquals = Array.getEquivalence(tupleEquivalence)

/** @internal */
const checkPathPatternMatchesSchema = (
  id: string,
  path: string,
  schema: Schema.Schema<any, any, unknown> | ApiSchema.Ignored
) => {
  const fromSchema = pipe(
    ApiSchema.isIgnored(schema) ? [] : getSchemaPropertySignatures(schema),
    Array.fromIterable,
    Array.map((ps) => [ps.name as string, ps.isOptional] as const),
    Array.sort(tupleOrder)
  )

  const fromPath = pipe(
    path.matchAll(/:(\w+)[?]?/g),
    Array.fromIterable,
    Array.map(([name]) => {
      if (name.endsWith("?")) {
        return [name.slice(1, -1), true] as const
      }
      return [name.slice(1), false] as const
    }),
    Array.sort(tupleOrder)
  )

  const matched = arrayOfTupleEquals(fromPath, fromSchema)

  if (!matched) {
    throw new Error(`Path doesn't match the param schema (endpoint: "${id}").`)
  }
}

/** @internal */
export const validateEndpoint = (endpoint: ApiEndpoint.ApiEndpoint.Any) => {
  checkPathPatternMatchesSchema(getId(endpoint), getPath(endpoint), ApiRequest.getPathSchema(getRequest(endpoint)))
}

/** @internal */
export const isApiEndpoint = (u: unknown): u is ApiEndpoint.ApiEndpoint.Any =>
  Predicate.hasProperty(u, TypeId) && Predicate.isObject(u[TypeId])
