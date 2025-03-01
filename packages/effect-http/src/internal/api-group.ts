import * as Pipeable from "effect/Pipeable"

import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as ApiGroup from "../ApiGroup.js"
import * as api_endpoint from "./api-endpoint.js"

/** @internal */
export const TypeId: ApiGroup.TypeId = Symbol.for(
  "effect-http/Api/ApiGroupTypeId"
) as ApiGroup.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _A: (_: never) => _
}

/** @internal */
export class ApiGroupImpl<Endpoints extends ApiEndpoint.ApiEndpoint.Any> implements ApiGroup.ApiGroup<Endpoints> {
  readonly [TypeId] = variance

  constructor(
    readonly name: string,
    readonly endpoints: ReadonlyArray<Endpoints>,
    readonly options: ApiGroup.Options
  ) {}

  pipe() {
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const isApiGroup = (u: unknown): u is ApiGroup.ApiGroup.Any => typeof u === "object" && u !== null && TypeId in u

/** @internal */
export const make = (name: string, options?: Partial<Api.Options>): ApiGroup.ApiGroup.Empty =>
  new ApiGroupImpl(name, [], { ...options })

/** @internal */
export const validateNewEndpoint = (
  self: ApiGroup.ApiGroup.Any,
  endpoint: ApiEndpoint.ApiEndpoint.Any
) => {
  if (self.endpoints.some((e) => ApiEndpoint.getId(e) === ApiEndpoint.getId(endpoint))) {
    throw new Error(`Endpoint with id ${ApiEndpoint.getId(endpoint)} already exists`)
  }
}

/** @internal */
export const addEndpoint =
  <E2 extends ApiEndpoint.ApiEndpoint.Any>(endpoint: E2) =>
  <E1 extends ApiEndpoint.ApiEndpoint.Any>(self: ApiGroup.ApiGroup<E1>): ApiGroup.ApiGroup<E1 | E2> => {
    api_endpoint.validateEndpoint(endpoint)
    validateNewEndpoint(self, endpoint)

    return new ApiGroupImpl(self.name, [...self.endpoints, endpoint], self.options)
  }

/** @internal */
export const setOptions =
  (options: Partial<ApiGroup.Options>) =>
  <A extends ApiEndpoint.ApiEndpoint.Any>(self: ApiGroup.ApiGroup<A>): ApiGroup.ApiGroup<A> =>
    new ApiGroupImpl(self.name, self.endpoints, { ...self.options, ...options })
