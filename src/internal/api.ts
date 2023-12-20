import type * as PlatformRouter from "@effect/platform/Http/Router";
import * as Schema from "@effect/schema/Schema";
import type * as Api from "../Api.js";
import * as Representation from "../Representation.js";
import * as utils from "./utils.js";
import * as Equivalence from "effect/Equivalence";
import { pipe } from "effect/Function";
import * as HashSet from "effect/HashSet";
import * as Order from "effect/Order";
import * as Pipeable from "effect/Pipeable";
import * as ReadonlyArray from "effect/ReadonlyArray";

/** @internal */
const composeResponseSchema = (
  response: readonly Api.InputResponseSchemaFull[],
) =>
  response.map(
    (r) =>
      ({
        status: r.status,
        headers: (r.headers && fieldsToLowerCase(r.headers)) ?? IgnoredSchemaId,
        content: r.content ?? IgnoredSchemaId,
        representations: r.representations ?? [Representation.json],
      }) as const,
  );

/** @internal */
const createSchemasFromInput = <I extends Api.InputEndpointSchemas>({
  response,
  request,
}: I): Api.CreateEndpointSchemasFromInput<I> =>
  ({
    response: Schema.isSchema(response)
      ? response
      : composeResponseSchema(utils.isArray(response) ? response : [response]),
    request: {
      query: request?.query ?? IgnoredSchemaId,
      params: request?.params ?? IgnoredSchemaId,
      body: request?.body ?? IgnoredSchemaId,
      headers:
        (request?.headers && fieldsToLowerCase(request?.headers)) ??
        IgnoredSchemaId,
    },
  }) as Api.CreateEndpointSchemasFromInput<I>;

/** @internal */
const tupleOrder = Order.tuple(Order.string, Order.boolean);

/** @internal */
const tupleEquivalence = Equivalence.tuple(
  Equivalence.string,
  Equivalence.boolean,
);

/** @internal */
const arrayOfTupleEquals = ReadonlyArray.getEquivalence(tupleEquivalence);

/** @internal */
const checkPathPatternMatchesSchema = (
  id: string,
  path: string,
  schema?: Schema.Schema<any>,
) => {
  const fromSchema = pipe(
    schema === undefined ? [] : utils.getSchemaPropertySignatures(schema),
    ReadonlyArray.fromIterable,
    ReadonlyArray.map((ps) => [ps.name as string, ps.isOptional] as const),
    ReadonlyArray.sort(tupleOrder),
  );

  const fromPath = pipe(
    path.matchAll(/:(\w+)[?]?/g),
    ReadonlyArray.fromIterable,
    ReadonlyArray.map(([name]) => {
      if (name.endsWith("?")) {
        return [name.slice(1, -1), true] as const;
      }
      return [name.slice(1), false] as const;
    }),
    ReadonlyArray.sort(tupleOrder),
  );

  const matched = arrayOfTupleEquals(fromPath, fromSchema);

  if (!matched) {
    throw new Error(`Path doesn't match the param schema (endpoint: "${id}").`);
  }
};

/** @internal */
export const endpoint =
  (method: Api.Method) =>
  <const Id extends string, const I extends Api.InputEndpointSchemas>(
    id: Id,
    path: PlatformRouter.PathInput,
    schemas: I,
    options?: Api.EndpointOptions,
  ) =>
  <A extends Api.Api | Api.ApiGroup>(api: A): Api.AddEndpoint<A, Id, I> => {
    if (method === "get" && schemas.request?.body !== undefined) {
      throw new Error(`Invalid ${id} endpoint. GET request cant have a body.`);
    }

    if (api.endpoints.find((endpoint) => endpoint.id === id) !== undefined) {
      throw new Error(`Endpoint with operation id ${id} already exists`);
    }

    if (
      utils.isArray(schemas.response) &&
      HashSet.size(
        HashSet.make(...schemas.response.map(({ status }) => status)),
      ) !== schemas.response.length
    ) {
      throw new Error(
        `Responses for endpoint ${id} must have unique status codes`,
      );
    }

    checkPathPatternMatchesSchema(id, path, schemas.request?.params);

    const newEndpoint = {
      schemas: createSchemasFromInput(schemas),
      id,
      path,
      method,
      groupName: "groupName" in api ? api.groupName : "default",
      ...options,
    };

    if (isApi(api)) {
      return new ApiImpl([...api.endpoints, newEndpoint], api.options) as any;
    }

    return new ApiGroupImpl(
      [...api.endpoints, newEndpoint],
      api.groupName,
    ) as any;
  };

/** Headers are case-insensitive, internally we deal with them as lowercase
 *  because that's how express deal with them.
 *
 *  @internal
 */
export const fieldsToLowerCase = (s: Schema.Schema<any>) => {
  const ast = s.ast;

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Expected type literal schema`);
  }

  const newPropertySignatures = ast.propertySignatures.map((ps) => {
    if (typeof ps.name !== "string") {
      throw new Error(`Expected string property key`);
    }

    return { ...ps, name: ps.name.toLowerCase() };
  });

  return Schema.make({ ...ast, propertySignatures: newPropertySignatures });
};

/** @internal */
const DEFAULT_OPTIONS: Api.Api["options"] = {
  title: "Api",
  version: "1.0.0",
};

export const apiGroup = (groupName: string): Api.ApiGroup<never> =>
  new ApiGroupImpl([], groupName);

export const getEndpoint = <
  A extends Api.Api,
  Id extends A["endpoints"][number]["id"],
>(
  api: A,
  id: Id,
): Extract<A["endpoints"][number], { id: Id }> => {
  const endpoint = api.endpoints.find(({ id: _id }) => _id === id);

  // This operation is type-safe and non-existing ids are forbidden
  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`);
  }

  return endpoint as any;
};

/**
 * Merge the Api `Group` with an `Api`
 *
 * @category combinators
 * @since 1.0.0
 */
export const addGroup =
  <E2 extends Api.Endpoint>(apiGroup: Api.ApiGroup<E2>) =>
  <E1 extends Api.Endpoint>(api: Api.Api<E1>): Api.Api<E1 | E2> => {
    const existingIds = HashSet.make(...api.endpoints.map(({ id }) => id));
    const newIds = HashSet.make(...apiGroup.endpoints.map(({ id }) => id));
    const duplicates = HashSet.intersection(existingIds, newIds);

    if (HashSet.size(duplicates) > 0) {
      throw new Error(
        `Api group introduces already existing operation ids: ${duplicates}`,
      );
    }

    return new ApiImpl([...api.endpoints, ...apiGroup.endpoints], api.options);
  };

export const api = (options?: Partial<Api.Api["options"]>): Api.Api<never> =>
  new ApiImpl([], { ...DEFAULT_OPTIONS, ...options });

export const isApi = (u: unknown): u is Api.Api<any> =>
  typeof u === "object" && u !== null && ApiTypeId in u;

export const isApiGroup = (u: unknown): u is Api.ApiGroup<any> =>
  typeof u === "object" && u !== null && ApiGroupTypeId in u;

export const ApiTypeId: Api.ApiTypeId = Symbol.for(
  "effect-http/Api/ApiTypeId",
) as Api.ApiTypeId;

export const ApiGroupTypeId: Api.ApiGroupTypeId = Symbol.for(
  "effect-http/Api/ApiGroupTypeId",
) as Api.ApiGroupTypeId;

export const IgnoredSchemaId: Api.IgnoredSchemaId = Symbol.for(
  "effect-http/ignore-schema-id",
) as Api.IgnoredSchemaId;

/** @internal */
class ApiImpl<Endpoints extends Api.Endpoint> implements Api.Api<Endpoints> {
  readonly [ApiTypeId]: Api.ApiTypeId;

  constructor(
    readonly endpoints: Endpoints[],
    readonly options: Api.Api["options"],
  ) {
    this[ApiTypeId] = ApiTypeId;
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments);
  }
}

/** @internal */
class ApiGroupImpl<Endpoints extends Api.Endpoint>
  implements Api.ApiGroup<Endpoints>
{
  readonly [ApiGroupTypeId]: Api.ApiGroupTypeId;

  constructor(
    readonly endpoints: Endpoints[],
    readonly groupName: string,
  ) {
    this[ApiGroupTypeId] = ApiGroupTypeId;
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments);
  }
}

export const formDataSchema = Schema.instanceOf(FormData, {
  jsonSchema: { type: "string" },
  description: "Multipart form data",
});
