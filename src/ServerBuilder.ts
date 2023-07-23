/**
 * Combinators and constructors for server-side implemnetation.
 *
 * @since 1.0.0
 */
import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type {
  Api,
  Endpoint,
  IgnoredSchemaId,
  ResponseSchemaFull,
} from "effect-http/Api";
import {
  Extension,
  accessLogExtension,
  errorLogExtension,
} from "effect-http/Extensions";
import type { ApiError } from "effect-http/ServerError";
import { ResponseUtil } from "effect-http/Utils";

import { AnySchema, SchemaTo } from "./internal/utils";

/**
 * @category models
 * @since 1.0.0
 */
export type ServerBuilder<
  R,
  Es extends Endpoint[] = Endpoint[],
  A extends Api = Api,
> = {
  unimplementedEndpoints: Es;
  handlers: ServerBuilderHandler<R>[];
  extensions: ServerExtension<R, A["endpoints"]>[];
  api: A;
};

/**
 * @category models
 * @since 1.0.0
 */
export type ServerBuilderHandler<R> = {
  fn: InputServerBuilderHandler<R, Endpoint>;
  endpoint: Endpoint;
};

/**
 * @category models
 * @since 1.0.0
 */
export type ServerExtension<R, Es extends Endpoint[]> = {
  extension: Extension<R>;
  options: ServerExtensionOptions<Es>;
};

/**
 * @category models
 * @since 1.0.0
 */
export type ServerExtensionOptions<Es extends Endpoint[]> = {
  skipOperations: Es[number]["id"][];
  allowOperations: Es[number]["id"][];
};

/**
 * Create new unimplemeted `ServerBuilder` from `Api`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const server = <A extends Api>(api: A): ApiToServer<A> =>
  ({
    unimplementedEndpoints: api.endpoints,
    api,

    handlers: [],
    extensions: defaultExtensions,
  }) as any;

/**
 * Implement handler for the given operation id.
 *
 * @category combinators
 * @since 1.0.0
 */
export const handle =
  <S extends ServerBuilder<any>, Id extends ServerUnimplementedIds<S>, R>(
    id: Id,
    fn: InputServerBuilderHandler<
      R,
      SelectEndpointById<S["unimplementedEndpoints"], Id>
    >,
  ) =>
  (server: S): AddServerHandle<S, Id, R> => {
    const endpoint = server.unimplementedEndpoints.find(
      ({ id: _id }) => _id === id,
    );

    if (endpoint === undefined) {
      throw new Error(`Operation id ${id} not found`);
    }

    const newUnimplementedEndpoints = server.unimplementedEndpoints.filter(
      ({ id: _id }) => _id !== id,
    );

    return {
      ...server,
      unimplementedEndpoints: newUnimplementedEndpoints,
      handlers: [...server.handlers, { fn, endpoint }],
    } as any;
  };

/**
 * Make sure that all the endpoints are implemented
 *
 * @category combinators
 * @since 1.0.0
 */
export const exhaustive = <R, A extends Api>(
  server: ServerBuilder<R, [], A>,
): ServerBuilder<R, [], A> => server;

/**
 * Type-helper providing type of a handler input given the type of the
 * Api `A` and operation id `Id`.
 *
 * ```
 * const api = pipe(
 *   Http.api(),
 *   Http.get("getMilan", "/milan", { response: Schema.string, query: Schema.string })
 * )
 *
 * type Api = typeof api;
 *
 * type GetMilanInput = Http.Input<Api, "getMilan">;
 * // -> { query: string }
 * ```
 *
 * @param A Api type of the API
 * @param Id operation id
 *
 * @category models
 * @since 1.0.0
 */
export type Input<
  A extends Api,
  Id extends A["endpoints"][number]["id"],
> = Parameters<
  InputServerBuilderHandler<never, Extract<A["endpoints"][number], { id: Id }>>
>[0];

/**
 * @category extensions
 * @since 1.0.0
 */
export const prependExtension =
  <R, S extends ServerBuilder<any>>(
    extension: Extension<R>,
    options?: Partial<ServerExtensionOptions<S["api"]["endpoints"]>>,
  ) =>
  (server: S): AddServerDependency<S, R> =>
    ({
      ...server,
      extensions: [
        createServerExtention(extension, options),
        ...server.extensions,
      ],
    }) as any;

/**
 * @category extensions
 * @since 1.0.0
 */
export const addExtension =
  <R, S extends ServerBuilder<any>>(
    extension: Extension<R>,
    options?: Partial<ServerExtensionOptions<S["api"]["endpoints"]>>,
  ) =>
  (server: S): AddServerDependency<S, R> =>
    ({
      ...server,
      extensions: [
        ...server.extensions,
        createServerExtention(extension, options),
      ],
    }) as any;

// Internals

/** @internal */
export const createServerExtention = <R, Es extends Endpoint[]>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<Es>>,
): ServerExtension<R, Es> => ({
  extension,
  options: {
    skipOperations: options?.skipOperations ?? [],
    allowOperations: options?.allowOperations ?? [],
  },
});

/** @internal */
const defaultExtensions = [
  createServerExtention(accessLogExtension()),
  createServerExtention(errorLogExtension()),
];

// Internal type helpers

/** @ignore */
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;

/** @ignore */
export type RequiredFields<E> = {
  [K in keyof E]: E[K] extends IgnoredSchemaId ? never : K;
}[keyof E];

/** @ignore */
export type EndpointSchemasTo<E extends Endpoint["schemas"]> = Schema.Spread<{
  response: EndpointResponseSchemaTo<E["response"]>;
  request: {
    [K in Extract<keyof E["request"], RequiredFields<E["request"]>>]: SchemaTo<
      E["request"][K]
    >;
  };
}>;

/** @ignore */
export type InputServerBuilderHandler<R, E extends Endpoint> = (
  input: Schema.Spread<
    EndpointSchemasTo<E["schemas"]>["request"] & {
      ResponseUtil: ResponseUtil<E>;
    }
  >,
) => Effect.Effect<
  R,
  ApiError,
  EndpointResponseSchemaTo<E["schemas"]["response"]>
>;

/** @ignore */
type ApiToServer<A extends Api> = A extends Api<infer Es>
  ? ServerBuilder<never, Es, A>
  : never;

/** @ignore */
type DropEndpoint<Es extends Endpoint[], Id extends string> = Es extends [
  infer First,
  ...infer Rest,
]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : [];

/** @ignore */
type ServerUnimplementedIds<S extends ServerBuilder<any>> =
  S["unimplementedEndpoints"][number]["id"];

/** @ignore */
type AddServerDependency<
  S extends ServerBuilder<any>,
  R,
> = S extends ServerBuilder<infer R0, infer E, infer A>
  ? ServerBuilder<R0 | R, E, A>
  : never;

/** @ignore */
type AddServerHandle<
  S extends ServerBuilder<any>,
  Id extends ServerUnimplementedIds<S>,
  R,
> = S extends ServerBuilder<infer R0, infer E, infer A>
  ? ServerBuilder<R0 | R, DropEndpoint<E, Id>, A>
  : never;

/** @ignore */
export type EndpointResponseSchemaTo<S> = S extends AnySchema
  ? Response | SchemaTo<S>
  : S extends readonly ResponseSchemaFull[]
  ? ResponseSchemaFullTo<S[number]>
  : never;

/** @ignore */
export type ResponseSchemaFullTo<S extends ResponseSchemaFull> = S extends any
  ? Schema.Spread<
      {
        status: S["status"];
      } & {
        [K in Exclude<RequiredFields<S>, "status">]: S[K] extends AnySchema
          ? Schema.To<S[K]>
          : never;
      }
    >
  : never;
