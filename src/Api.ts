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
import type * as OpenApi from "schema-openapi";

import * as Schema from "@effect/schema/Schema";
import * as utils from "effect-http/internal/utils";
import * as Equivalence from "effect/Equivalence";
import { pipe } from "effect/Function";
import * as HashSet from "effect/HashSet";
import * as Order from "effect/Order";
import * as Pipeable from "effect/Pipeable";
import * as ReadonlyArray from "effect/ReadonlyArray";
import type * as Types from "effect/Types";

/** Headers are case-insensitive, internally we deal with them as lowercase
 *  because that's how express deal with them.
 *
 *  @internal
 */
export const fieldsToLowerCase = (s: utils.AnySchema) => {
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
const composeResponseSchema = (response: readonly InputResponseSchemaFull[]) =>
  response.map(
    (r) =>
      ({
        status: r.status,
        headers: (r.headers && fieldsToLowerCase(r.headers)) ?? IgnoredSchemaId,
        content: r.content ?? IgnoredSchemaId,
      }) as const,
  );

/** @internal */
const createSchemasFromInput = <I extends InputEndpointSchemas>({
  response,
  request,
}: I): CreateEndpointSchemasFromInput<I> =>
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
  }) as CreateEndpointSchemasFromInput<I>;

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
  schema?: utils.AnySchema,
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
  (method: OpenApi.OpenAPISpecMethodName) =>
  <const Id extends string, const I extends InputEndpointSchemas>(
    id: Id,
    path: string,
    schemas: I,
    options?: EndpointOptions,
  ) =>
  <A extends Api | ApiGroup>(api: A): AddEndpoint<A, Id, I> => {
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

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointSchemas {
  response:
    | utils.AnySchema
    | ResponseSchemaFull
    | readonly ResponseSchemaFull[];
  request: {
    query: utils.AnySchema | IgnoredSchemaId;
    params: utils.AnySchema | IgnoredSchemaId;
    body: utils.AnySchema | IgnoredSchemaId;
    headers: utils.AnySchema | IgnoredSchemaId;
  };
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Endpoint {
  id: string;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  schemas: EndpointSchemas;
  groupName: string;
  description?: string;
}

/**
 * @since 1.0.0
 * @category type id
 */
export const ApiTypeId: unique symbol = Symbol.for("effect-http/Api/ApiTypeId");

/**
 * @since 1.0.0
 * @category type id
 */
export type ApiTypeId = typeof ApiTypeId;

/**
 * @category models
 * @since 1.0.0
 */
export interface Api<E extends Endpoint = Endpoint> extends Pipeable.Pipeable {
  [ApiTypeId]: ApiTypeId;
  endpoints: E[];
  options: {
    title: string;
    version: string;
  };
}

/**
 * @since 1.0.0
 * @category type id
 */
export const ApiGroupTypeId: unique symbol = Symbol.for(
  "effect-http/Api/ApiGroupTypeId",
);

/**
 * @since 1.0.0
 * @category type id
 */
export type ApiGroupTypeId = typeof ApiGroupTypeId;

/**
 * @category refinements
 * @since 1.0.0
 */
export const isApi = (u: unknown): u is Api<any> =>
  typeof u === "object" && u !== null && ApiTypeId in u;

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiGroup<E extends Endpoint = Endpoint>
  extends Pipeable.Pipeable {
  [ApiGroupTypeId]: ApiGroupTypeId;
  endpoints: E[];
  groupName: string;
}

/**
 * @category refinements
 * @since 1.0.0
 */
export const isApiGroup = (u: unknown): u is ApiGroup<any> =>
  typeof u === "object" && u !== null && ApiGroupTypeId in u;

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointOptions {
  description?: string;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface InputEndpointSchemas {
  response:
    | InputResponseSchemaFull
    | readonly InputResponseSchemaFull[]
    | utils.AnySchema;
  request?: {
    query?: utils.AnySchema;
    params?: utils.AnySchema;
    body?: utils.AnySchema;
    headers?: utils.AnySchema;
  };
}

/** @internal */
const DEFAULT_OPTIONS: Api["options"] = {
  title: "Api",
  version: "1.0.0",
};

/**
 * @category constructors
 * @since 1.0.0
 */
export const api = (options?: Partial<Api["options"]>): Api<never> =>
  new ApiImpl([], { ...DEFAULT_OPTIONS, ...options });

/**
 * @category models
 * @since 1.0.0
 */
type EndpointSetter = <
  const Id extends string,
  const I extends InputEndpointSchemas,
>(
  id: Id,
  path: string,
  schemas: I,
  options?: EndpointOptions,
) => <A extends Api | ApiGroup>(api: A) => AddEndpoint<A, Id, I>;

/**
 * @category methods
 * @since 1.0.0
 */
export const get: EndpointSetter = endpoint("get");

/**
 * @category methods
 * @since 1.0.0
 */
export const post: EndpointSetter = endpoint("post");

/**
 * @category methods
 * @since 1.0.0
 */
export const put: EndpointSetter = endpoint("put");

/**
 * @category methods
 * @since 1.0.0
 */
export const head: EndpointSetter = endpoint("head");

/**
 * @category methods
 * @since 1.0.0
 */
export const patch: EndpointSetter = endpoint("patch");

/**
 * @category methods
 * @since 1.0.0
 */
export const trace: EndpointSetter = endpoint("trace");

const _delete: EndpointSetter = endpoint("delete");

export {
  /**
   * @category methods
   * @since 1.0.0
   */
  _delete as delete,
};

/**
 * @category methods
 * @since 1.0.0
 */
export const options: EndpointSetter = endpoint("options");

/**
 * Create new API group with a given name
 *
 * @category constructors
 * @since 1.0.0
 */
export const apiGroup = (groupName: string): ApiGroup<never> =>
  new ApiGroupImpl([], groupName);

/**
 * Merge the Api `Group` with an `Api`
 *
 * @category combinators
 * @since 1.0.0
 */
export const addGroup =
  <E2 extends Endpoint>(apiGroup: ApiGroup<E2>) =>
  <E1 extends Endpoint>(api: Api<E1>): Api<E1 | E2> => {
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

const _FormData = Schema.instanceOf(FormData).pipe(
  Schema.jsonSchema({ type: "string" }),
  Schema.description("Multipart form data"),
);

export {
  /**
   * FormData schema
   *
   * @category schemas
   * @since 1.0.0
   */
  _FormData as FormData,
};

// Internal type helpers

/** @ignore */
type CreateEndpointFromInput<
  Id extends string,
  Schemas extends InputEndpointSchemas,
> = {
  id: Id;
  schemas: CreateEndpointSchemasFromInput<Schemas>;
  path: string;
  method: OpenApi.OpenAPISpecMethodName;
  groupName: string;
  description?: string;
};

/** @ignore */
type AddEndpoint<
  A extends Api | ApiGroup,
  Id extends string,
  Schemas extends InputEndpointSchemas,
> = A extends Api<infer E>
  ? Api<E | Types.Simplify<CreateEndpointFromInput<Id, Schemas>>>
  : A extends ApiGroup<infer E>
    ? ApiGroup<E | Types.Simplify<CreateEndpointFromInput<Id, Schemas>>>
    : never;

/** @ignore */
export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");

/** @ignore */
export type IgnoredSchemaId = typeof IgnoredSchemaId;

/** @ignore */
type ResponseSchemaFromInput<S extends InputEndpointSchemas["response"]> =
  S extends utils.AnySchema
    ? S
    : S extends readonly InputResponseSchemaFull[]
      ? ComputeEndpointResponseFull<S>
      : S extends InputResponseSchemaFull
        ? ResponseSchemaFullFromInput<S>
        : never;

type GetOptional<
  A extends Record<string, unknown> | undefined,
  K extends keyof Exclude<A, undefined>,
> = A extends Record<string, unknown>
  ? K extends keyof A
    ? A[K]
    : undefined
  : undefined;

/** @ignore */
export type CreateEndpointSchemasFromInput<I extends InputEndpointSchemas> =
  Types.Simplify<{
    response: ResponseSchemaFromInput<I["response"]>;
    request: {
      query: UndefinedToIgnoredSchema<GetOptional<I["request"], "query">>;
      params: UndefinedToIgnoredSchema<GetOptional<I["request"], "params">>;
      body: UndefinedToIgnoredSchema<GetOptional<I["request"], "body">>;
      headers: UndefinedToIgnoredSchemaLowercased<
        GetOptional<I["request"], "headers">
      >;
    };
  }>;

/** @ignore */
type UndefinedToIgnoredSchema<S extends unknown | undefined> =
  S extends utils.AnySchema ? S : IgnoredSchemaId;

/** @ignore */
type UndefinedToIgnoredSchemaLowercased<S extends unknown | undefined> =
  S extends Schema.Schema<infer I, infer O>
    ? O extends Record<string, any>
      ? I extends Record<string, any>
        ? Schema.Schema<LowercaseFields<I>, LowercaseFields<O>>
        : never
      : never
    : IgnoredSchemaId;

/** @ignore */
type LowercaseFields<A extends Record<string, unknown>> = Types.Simplify<{
  [K in keyof A as K extends string ? Lowercase<K> : never]: A[K];
}>;

/** @ignore */
export type ComputeEndpointResponseFull<
  Rs extends readonly InputResponseSchemaFull[],
> = Rs extends readonly [infer R, ...infer Rest]
  ? R extends InputResponseSchemaFull
    ? Rest extends readonly InputResponseSchemaFull[]
      ? [ResponseSchemaFullFromInput<R>, ...ComputeEndpointResponseFull<Rest>]
      : never
    : never
  : [];

/** @ignore */
type ResponseSchemaFullFromInput<R extends InputResponseSchemaFull> = {
  status: R["status"];
  content: UndefinedToIgnoredSchema<R["content"]>;
  headers: UndefinedToIgnoredSchemaLowercased<R["headers"]>;
};

/** @ignore */
export interface ResponseSchemaFull {
  status: number;
  content: utils.AnySchema | IgnoredSchemaId;
  headers: utils.AnySchema | IgnoredSchemaId;
}

/** @ignore */
export interface InputResponseSchemaFull {
  status: number;
  content?: utils.AnySchema;
  headers?: utils.AnySchema;
}

/**
 * @category utils
 * @since 1.0.0
 */
export const getEndpoint = <
  A extends Api,
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

/** @internal */
class ApiImpl<Endpoints extends Endpoint> implements Api<Endpoints> {
  readonly [ApiTypeId]: ApiTypeId;

  constructor(
    readonly endpoints: Endpoints[],
    readonly options: Api["options"],
  ) {
    this[ApiTypeId] = ApiTypeId;
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments);
  }
}

/** @internal */
class ApiGroupImpl<Endpoints extends Endpoint> implements ApiGroup<Endpoints> {
  readonly [ApiGroupTypeId]: ApiGroupTypeId;

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
