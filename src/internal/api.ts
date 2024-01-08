import type * as PlatformRouter from "@effect/platform/Http/Router"
import * as Schema from "@effect/schema/Schema"
import * as Equivalence from "effect/Equivalence"
import { pipe } from "effect/Function"
import * as HashSet from "effect/HashSet"
import * as Order from "effect/Order"
import * as Pipeable from "effect/Pipeable"
import * as ReadonlyArray from "effect/ReadonlyArray"
import type * as Api from "../Api.js"
import * as Representation from "../Representation.js"

/** @internal */
const composeResponseSchema = (
  response: ReadonlyArray<Api.InputResponseSchemaFull>
) =>
  response.map(
    (r) =>
      ({
        status: r.status,
        headers: (r.headers && fieldsToLowerCase(r.headers)) ?? IgnoredSchemaId,
        content: r.content ?? IgnoredSchemaId,
        representations: r.representations ?? [Representation.json]
      }) as const
  )

/** @internal */
const createSchemasFromInput = <I extends Api.InputEndpointSchemas>({
  request,
  response
}: I): Api.CreateEndpointSchemasFromInput<I> =>
  ({
    response: Schema.isSchema(response)
      ? response
      : composeResponseSchema(Array.isArray(response) ? response : [response]),
    request: {
      query: request?.query ?? IgnoredSchemaId,
      params: request?.params ?? IgnoredSchemaId,
      body: request?.body ?? IgnoredSchemaId,
      headers: (request?.headers && fieldsToLowerCase(request?.headers)) ??
        IgnoredSchemaId
    }
  }) as Api.CreateEndpointSchemasFromInput<I>

/** @internal */
const tupleOrder = Order.tuple(Order.string, Order.boolean)

/** @internal */
const tupleEquivalence = Equivalence.tuple(
  Equivalence.string,
  Equivalence.boolean
)

/** @internal */
const arrayOfTupleEquals = ReadonlyArray.getEquivalence(tupleEquivalence)

/** @internal */
const getSchemaPropertySignatures = (schema: Schema.Schema<any>) => {
  let ast = schema.ast

  if (ast._tag === "Transform") {
    ast = ast.from
  }

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Response headers must be a type literal schema`)
  }

  return ast.propertySignatures
}

/** @internal */
const checkPathPatternMatchesSchema = (
  id: string,
  path: string,
  schema?: Schema.Schema<any>
) => {
  const fromSchema = pipe(
    schema === undefined ? [] : getSchemaPropertySignatures(schema),
    ReadonlyArray.fromIterable,
    ReadonlyArray.map((ps) => [ps.name as string, ps.isOptional] as const),
    ReadonlyArray.sort(tupleOrder)
  )

  const fromPath = pipe(
    path.matchAll(/:(\w+)[?]?/g),
    ReadonlyArray.fromIterable,
    ReadonlyArray.map(([name]) => {
      if (name.endsWith("?")) {
        return [name.slice(1, -1), true] as const
      }
      return [name.slice(1), false] as const
    }),
    ReadonlyArray.sort(tupleOrder)
  )

  const matched = arrayOfTupleEquals(fromPath, fromSchema)

  if (!matched) {
    throw new Error(`Path doesn't match the param schema (endpoint: "${id}").`)
  }
}

/** @internal */
export const endpoint = (method: Api.Method) =>
<const Id extends string, const I extends Api.InputEndpointSchemas>(
  id: Id,
  path: PlatformRouter.PathInput,
  schemas: I,
  options?: Api.EndpointOptions
) =>
<A extends Api.Api | Api.ApiGroup>(api: A): Api.AddEndpoint<A, Id, I> => {
  if (method === "get" && schemas.request?.body !== undefined) {
    throw new Error(`Invalid ${id} endpoint. GET request cant have a body.`)
  }

  if (isApiGroup(api) && api.endpoints.find((endpoint) => endpoint.id === id) !== undefined) {
    throw new Error(`Endpoint with operation id ${id} already exists`)
  }

  if (isApi(api) && api.groups.find((group) => group.endpoints.find((endpoint) => endpoint.id === id)) !== undefined) {
    throw new Error(`Endpoint with operation id ${id} already exists`)
  }

  if (
    Array.isArray(schemas.response) &&
    HashSet.size(
        HashSet.make(...schemas.response.map(({ status }) => status))
      ) !== schemas.response.length
  ) {
    throw new Error(
      `Responses for endpoint ${id} must have unique status codes`
    )
  }

  checkPathPatternMatchesSchema(id, path, schemas.request?.params)

  const newEndpoint = {
    schemas: createSchemasFromInput(schemas),
    id,
    path,
    method,
    options: {
      ...options,
      groupName: "groupName" in api ? api.groupName : "default"
    }
  }

  if (isApiGroup(api)) {
    return new ApiGroupImpl(
      [...api.endpoints, newEndpoint],
      api.options
    ) as any
  } else {
    const defaultGroup = api.groups.find((x) => x.options.name === "default") ?? apiGroup("default")
    const groupsWithoutDefault = api.groups.filter((x) => x.options.name !== "default")

    const newDefaultGroup = pipe(defaultGroup, endpoint(method)(id, path, schemas, options))

    return new ApiImpl(
      [...groupsWithoutDefault, newDefaultGroup],
      api.options
    ) as any
  }
}

/** Headers are case-insensitive, internally we deal with them as lowercase
 *  because that's how express deal with them.
 *
 *  @internal
 */
export const fieldsToLowerCase = (s: Schema.Schema<any>) => {
  const ast = s.ast

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Expected type literal schema`)
  }

  const newPropertySignatures = ast.propertySignatures.map((ps) => {
    if (typeof ps.name !== "string") {
      throw new Error(`Expected string property key`)
    }

    return { ...ps, name: ps.name.toLowerCase() }
  })

  return Schema.make({ ...ast, propertySignatures: newPropertySignatures })
}

/** @internal */
const DEFAULT_OPTIONS: Api.Api["options"] = {
  title: "Api",
  version: "1.0.0"
}

export const apiGroup = (
  name: Api.ApiGroup["options"]["name"],
  options?: Omit<Api.ApiGroup["options"], "name">
): Api.ApiGroup<never> => new ApiGroupImpl([], { name, ...options })

export const getEndpoint = <
  A extends Api.Api,
  Id extends A["groups"][number]["endpoints"][number]["id"]
>(
  api: A,
  id: Id
): Extract<A["groups"][number]["endpoints"][number], { id: Id }> => {
  let endpoint: Api.Endpoint | undefined = undefined

  api.groups.find((g) =>
    g.endpoints.find((e) => {
      if (e.id === id) {
        endpoint = e
        return true
      } else {
        return false
      }
    })
  )

  // This operation is type-safe and non-existing ids are forbidden
  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`)
  }

  return endpoint as any
}

/**
 * Merge the Api `Group` with an `Api`
 *
 * @category combinators
 * @since 1.0.0
 */
export const addGroup =
  <E2 extends Api.Endpoint>(apiGroup: Api.ApiGroup<E2>) =>
  <E1 extends Api.Endpoint>(api: Api.Api<E1>): Api.Api<E1 | E2> => {
    const existingIds = HashSet.make(...api.groups.flatMap((x) => x.endpoints).map(({ id }) => id))
    const newIds = HashSet.make(...apiGroup.endpoints.map(({ id }) => id))
    const duplicates = HashSet.intersection(existingIds, newIds)

    if (HashSet.size(duplicates) > 0) {
      throw new Error(
        `Api group introduces already existing operation ids: ${duplicates}`
      )
    }
    const newGroups: Array<Api.ApiGroup<E1 | E2>> = [...api.groups, apiGroup]

    return new ApiImpl(newGroups, api.options)
  }

export const api = (options?: Partial<Api.Api["options"]>): Api.Api<never> =>
  new ApiImpl([], { ...DEFAULT_OPTIONS, ...options })

export const isApi = (u: unknown): u is Api.Api<any> => typeof u === "object" && u !== null && ApiTypeId in u

export const isApiGroup = (u: unknown): u is Api.ApiGroup<any> =>
  typeof u === "object" && u !== null && ApiGroupTypeId in u

export const ApiTypeId: Api.ApiTypeId = Symbol.for(
  "effect-http/Api/ApiTypeId"
) as Api.ApiTypeId

export const ApiGroupTypeId: Api.ApiGroupTypeId = Symbol.for(
  "effect-http/Api/ApiGroupTypeId"
) as Api.ApiGroupTypeId

/** @ignore */
export type IgnoredSchemaId = typeof IgnoredSchemaId

export const IgnoredSchemaId: Api.IgnoredSchemaId = Symbol.for(
  "effect-http/ignore-schema-id"
) as Api.IgnoredSchemaId

/** @internal */
class ApiImpl<Endpoints extends Api.Endpoint> implements Api.Api<Endpoints> {
  readonly [ApiTypeId]: Api.ApiTypeId = ApiTypeId

  constructor(
    readonly groups: Array<Api.ApiGroup<Endpoints>>,
    readonly options: Api.Api["options"]
  ) {
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
class ApiGroupImpl<Endpoints extends Api.Endpoint> implements Api.ApiGroup<Endpoints> {
  readonly [ApiGroupTypeId]: Api.ApiGroupTypeId = ApiGroupTypeId

  constructor(
    readonly endpoints: Array<Endpoints>,
    readonly options: Api.ApiGroup["options"]
  ) {
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

export const formDataSchema = Schema.instanceOf(FormData, {
  jsonSchema: { type: "string" },
  description: "Multipart form data"
})
