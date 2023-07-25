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

import * as Equivalence from "@effect/data/Equivalence";
import { pipe } from "@effect/data/Function";
import * as HashSet from "@effect/data/HashSet";
import * as Order from "@effect/data/Order";
import * as RA from "@effect/data/ReadonlyArray";
import * as Schema from "@effect/schema/Schema";

import {
  AnySchema,
  getSchemaPropertySignatures,
  isArray,
} from "effect-http/internal";

/** Headers are case-insensitive, internally we deal with them as lowercase
 *  because that's how express deal with them.
 *
 *  @internal
 */
export const fieldsToLowerCase = (s: AnySchema) => {
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
      : composeResponseSchema(isArray(response) ? response : [response]),
    request: {
      query: request?.query ?? IgnoredSchemaId,
      params: request?.params ?? IgnoredSchemaId,
      body: request?.body ?? IgnoredSchemaId,
      headers:
        (request?.headers && fieldsToLowerCase(request?.headers)) ??
        IgnoredSchemaId,
    },
  }) as CreateEndpointSchemasFromInput<I>;

const tupleOrder = Order.tuple(Order.string, Order.boolean) as Order.Order<
  readonly [string, boolean]
>; // TODO check on @effect/data why the type is not readonly
const tupleEquivalence = Equivalence.tuple(
  Equivalence.string,
  Equivalence.boolean,
);
const arrayOfTupleEquals = RA.getEquivalence(tupleEquivalence);

const checkPathPatternMatchesSchema = (
  id: string,
  path: string,
  schema?: AnySchema,
) => {
  const fromSchema = pipe(
    schema === undefined ? [] : getSchemaPropertySignatures(schema),
    RA.fromIterable,
    RA.map((ps) => [ps.name as string, ps.isOptional] as const),
    RA.sort(tupleOrder),
  );

  const fromPath = pipe(
    path.matchAll(/:(\w+)[?]?/g),
    RA.fromIterable,
    RA.map(([name]) => {
      if (name.endsWith("?")) {
        return [name.slice(1, -1), true] as const;
      }
      return [name.slice(1), false] as const;
    }),
    RA.sort(tupleOrder),
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
      isArray(schemas.response) &&
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

    return { ...api, endpoints: [...api.endpoints, newEndpoint] } as any;
  };

/**
 * @category models
 * @since 1.0.0
 */
export interface EndpointSchemas {
  response: AnySchema | ResponseSchemaFull | readonly ResponseSchemaFull[];
  request: {
    query: AnySchema | IgnoredSchemaId;
    params: AnySchema | IgnoredSchemaId;
    body: AnySchema | IgnoredSchemaId;
    headers: AnySchema | IgnoredSchemaId;
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
 * @category models
 * @since 1.0.0
 */
export interface Api<E extends Endpoint[] = Endpoint[]> {
  endpoints: E;
  options: {
    title: string;
    version: string;
  };
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ApiGroup<E extends Endpoint[] = Endpoint[]> {
  endpoints: E;
  groupName: string;
}

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
    | AnySchema;
  request?: {
    query?: AnySchema;
    params?: AnySchema;
    body?: AnySchema;
    headers?: AnySchema;
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
export const api = (options?: Partial<Api["options"]>): Api<[]> => ({
  options: {
    ...DEFAULT_OPTIONS,
    ...options,
  },
  endpoints: [],
});

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
export const options = endpoint("options");

/**
 * Create new API group with a given name
 *
 * @category constructors
 * @since 1.0.0
 */
export const apiGroup = (groupName: string): ApiGroup<[]> => ({
  endpoints: [],
  groupName,
});

/**
 * Merge the Api `Group` with an `Api`
 *
 * @category combinators
 * @since 1.0.0
 */
export const addGroup =
  <E2 extends Endpoint[]>(apiGroup: ApiGroup<E2>) =>
  <E1 extends Endpoint[]>(api: Api<E1>): Api<[...E1, ...E2]> => {
    const existingIds = HashSet.make(...api.endpoints.map(({ id }) => id));
    const newIds = HashSet.make(...apiGroup.endpoints.map(({ id }) => id));
    const duplicates = HashSet.intersection(existingIds, newIds);

    if (HashSet.size(duplicates) > 0) {
      throw new Error(
        `Api group introduces already existing operation ids: ${duplicates}`,
      );
    }

    return {
      ...api,
      endpoints: [...api.endpoints, ...apiGroup.endpoints],
    };
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
  ? Api<[...E, Schema.Spread<CreateEndpointFromInput<Id, Schemas>>]>
  : A extends ApiGroup<infer E>
  ? ApiGroup<[...E, Schema.Spread<CreateEndpointFromInput<Id, Schemas>>]>
  : never;

/** @ignore */
export const IgnoredSchemaId = Symbol("effect-http/ignore-schema-id");

/** @ignore */
export type IgnoredSchemaId = typeof IgnoredSchemaId;

/** @ignore */
type ResponseSchemaFromInput<S extends InputEndpointSchemas["response"]> =
  S extends AnySchema
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
  Schema.Spread<{
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
  S extends AnySchema ? S : IgnoredSchemaId;

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
type LowercaseFields<A extends Record<string, unknown>> = Schema.Spread<{
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
  content: AnySchema | IgnoredSchemaId;
  headers: AnySchema | IgnoredSchemaId;
}

/** @ignore */
export interface InputResponseSchemaFull {
  status: number;
  content?: AnySchema;
  headers?: AnySchema;
}
