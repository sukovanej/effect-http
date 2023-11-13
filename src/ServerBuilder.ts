/**
 * Combinators and constructors for server-side implemnetation.
 *
 * @since 1.0.0
 */
import { type Effect, Pipeable, type Types } from "effect";
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
import type { ResponseUtil } from "effect-http/Utils";
import type { AnySchema, SchemaTo } from "effect-http/internal/utils";

/**
 * @category models
 * @since 1.0.0
 */
export interface ServerBuilder<
  R,
  Endpoints extends Endpoint = Endpoint,
  A extends Api = Api,
> extends Pipeable.Pipeable {
  unimplementedEndpoints: Endpoints[];
  handlers: ServerBuilderHandler<R>[];
  extensions: ServerExtension<R, A["endpoints"][number]>[];
  api: A;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ServerBuilderHandler<R> {
  fn: InputServerBuilderHandler<R, Endpoint>;
  endpoint: Endpoint;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ServerExtension<R, Es extends Endpoint> {
  extension: Extension<R>;
  options: ServerExtensionOptions<Es>;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface ServerExtensionOptions<Es extends Endpoint> {
  skipOperations: Es["id"][];
  allowOperations: Es["id"][];
}

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
    pipe() {
      // eslint-disable-next-line prefer-rest-params
      return Pipeable.pipeArguments(this, arguments);
    },
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
      Extract<S["unimplementedEndpoints"][number], { id: Id }>
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
  server: ServerBuilder<R, never, A>,
): ServerBuilder<R, never, A> => server;

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
    options?: Partial<ServerExtensionOptions<S["api"]["endpoints"][number]>>,
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
    options?: Partial<ServerExtensionOptions<S["api"]["endpoints"][number]>>,
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
export const createServerExtention = <R, Es extends Endpoint>(
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
export type RequiredFields<E> = {
  [K in keyof E]: E[K] extends IgnoredSchemaId ? never : K;
}[keyof E];

/** @ignore */
export type EndpointSchemasTo<E extends Endpoint["schemas"]> = Types.Simplify<{
  response: EndpointResponseSchemaTo<E["response"]>;
  request: {
    [K in Extract<keyof E["request"], RequiredFields<E["request"]>>]: SchemaTo<
      E["request"][K]
    >;
  };
}>;

/** @ignore */
export type InputServerBuilderHandler<R, E extends Endpoint> = (
  input: Types.Simplify<
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
  ? ServerBuilder<R0 | R, Exclude<E, { id: Id }>, A>
  : never;

/** @ignore */
export type EndpointResponseSchemaTo<S> = S extends AnySchema
  ? SchemaTo<S>
  : S extends readonly ResponseSchemaFull[]
  ? ResponseSchemaFullTo<S[number]>
  : S extends ResponseSchemaFull
  ? ResponseSchemaFullTo<S>
  : never;

/** @ignore */
export type ResponseSchemaFullTo<S extends ResponseSchemaFull> = S extends any
  ? Types.Simplify<
      {
        status: S["status"];
      } & {
        [K in Exclude<RequiredFields<S>, "status">]: S[K] extends AnySchema
          ? SchemaTo<S[K]>
          : never;
      }
    >
  : never;
