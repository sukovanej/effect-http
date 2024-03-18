import * as Pipeable from "effect/Pipeable"
import * as ReadonlyArray from "effect/ReadonlyArray"
import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiGroup from "../ApiGroup.js"
import * as api_endpoint from "./api-endpoint.js"
import * as api_group from "./api-group.js"

export const TypeId: Api.TypeId = Symbol.for(
  "effect-http/Api/TypeId"
) as Api.TypeId

/** @internal */
class ApiImpl<Endpoints extends ApiEndpoint.ApiEndpoint.Any> implements Api.Api<Endpoints> {
  readonly [TypeId]: Api.TypeId = TypeId

  constructor(
    readonly groups: ReadonlyArray<ApiGroup.ApiGroup<Endpoints>>,
    readonly options: Api.Api.Any["options"]
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
const DEFAULT_API_OPTIONS: Api.Api.Any["options"] = {
  title: "Api",
  version: "1.0.0"
}

/** @internal */
export const isApi = (u: unknown): u is Api.Api.Any => typeof u === "object" && u !== null && TypeId in u

/** @internal */
export const make = (options?: Partial<Api.ApiOptions>): Api.Api.Empty =>
  new ApiImpl([], { ...DEFAULT_API_OPTIONS, ...options })

/** @internal */
export const addEndpoint =
  <E2 extends ApiEndpoint.ApiEndpoint.Any>(endpoint: E2) =>
  <E1 extends ApiEndpoint.ApiEndpoint.Any>(api: Api.Api<E1>): Api.Api<E1 | E2> => {
    api_endpoint.validateEndpoint(endpoint)
    api.groups.forEach((group) => api_group.validateNewEndpoint(group, endpoint))

    const defaultGroup = api.groups.find((group) => group.name === "default") ?? ApiGroup.make("default")
    const groupsWithoutDefault = api.groups.filter((group) => group.name !== "default")
    const newDefaultGroup = new api_group.ApiGroupImpl(
      "default",
      [...defaultGroup.endpoints, endpoint],
      defaultGroup.options
    )
    return new ApiImpl([...groupsWithoutDefault, newDefaultGroup], api.options) as any
  }

/** @internal */
export const addGroup = <E2 extends ApiEndpoint.ApiEndpoint.Any>(
  group: ApiGroup.ApiGroup<E2>
) =>
<E1 extends ApiEndpoint.ApiEndpoint.Any>(self: Api.Api<E1>): Api.Api<E1 | E2> => {
  const current = self.groups.flatMap((group) => group.endpoints.map(ApiEndpoint.getId))
  const incomming = group.endpoints.map(ApiEndpoint.getId)

  if (ReadonlyArray.intersection(current, incomming).length > 0) {
    throw new Error(`Duplicate endpoint ids found in the group`)
  }

  return new ApiImpl<E1 | E2>([...self.groups, group], self.options)
}

/** @internal */
export const getEndpoint = <A extends Api.Api.Any, Id extends Api.Api.Ids<A>>(
  api: A,
  id: Id
): Api.Api.EndpointById<A, Id> => {
  const endpoint = api.groups.flatMap((group) => group.endpoints).find((endpoint) => ApiEndpoint.getId(endpoint) === id)

  if (endpoint === undefined) {
    throw new Error(`Endpoint with id ${id} not found`)
  }

  return endpoint as Api.Api.EndpointById<A, Id>
}
