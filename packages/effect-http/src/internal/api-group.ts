import * as Pipeable from "effect/Pipeable"
import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as ApiGroup from "../ApiGroup.js"
import * as api_endpoint from "./api-endpoint.js"

export const TypeId: ApiGroup.TypeId = Symbol.for(
  "effect-http/Api/ApiGroupTypeId"
) as ApiGroup.TypeId

/** @internal */
export class ApiGroupImpl<Endpoints extends ApiEndpoint.ApiEndpoint.Any> implements ApiGroup.ApiGroup<Endpoints> {
  readonly [TypeId] = TypeId

  constructor(
    readonly name: string,
    readonly endpoints: Array<Endpoints>,
    readonly options: ApiGroup.ApiGroup.Any["options"]
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const isApiGroup = (u: unknown): u is ApiGroup.ApiGroup.Any => typeof u === "object" && u !== null && TypeId in u

/** @internal */
export const make = (name: string, options?: Partial<Api.ApiOptions>): ApiGroup.ApiGroup.Empty =>
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

export const addEndpoint =
  <E2 extends ApiEndpoint.ApiEndpoint.Any>(endpoint: E2) =>
  <E1 extends ApiEndpoint.ApiEndpoint.Any>(self: ApiGroup.ApiGroup<E1>): ApiGroup.ApiGroup<E1 | E2> => {
    api_endpoint.validateEndpoint(endpoint)
    validateNewEndpoint(self, endpoint)

    return new ApiGroupImpl(self.name, [...self.endpoints, endpoint], self.options)
  }
