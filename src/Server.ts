/**
 * Combinators and constructors for server-side implemnetation.
 *
 * @since 1.0.0
 */
import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint } from "effect-http/Api";
import type { ApiError } from "effect-http/ServerError";
import * as internal from "effect-http/internal/server";

import type { Extension } from "./Extensions";

/**
 * @category models
 * @since 1.0.0
 */
export type Server<
  R,
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
  A extends Api = Api,
> = {
  _unimplementedEndpoints: UnimplementedEndpoints;

  handlers: Handler<R>[];
  extensions: ServerExtension<R, A["endpoints"]>[];
  api: A;
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

type NonIgnoredFields<K extends keyof A, A> = K extends any
  ? A[K] extends
      | Schema.Schema<any, any>
      | Record<string, Schema.Schema<any, any>>
    ? K
    : never
  : never;

type RemoveIgnoredSchemas<E> = Pick<E, NonIgnoredFields<keyof E, E>>;

type SchemaStructTo<A> = {
  [K in keyof A]: K extends "query" | "params" | "headers"
    ? A[K] extends Record<string, Schema.Schema<any>>
      ? { [KQ in keyof A[K]]: Schema.To<A[K][KQ]> }
      : never
    : A[K] extends Schema.Schema<any, infer X>
    ? X
    : never;
};

/**
 * @ignored
 * @since 1.0.0
 */
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;

/**
 * @ignored
 * @since 1.0.0
 */
export type EndpointSchemasToInput<E extends Endpoint["schemas"]> =
  Schema.Spread<SchemaStructTo<RemoveIgnoredSchemas<Omit<E, "response">>>>;

/**
 * @ignored
 * @since 1.0.0
 */
export type InputHandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E["schemas"]>,
) => Effect.Effect<R, ApiError, HandlerResponse<E["schemas"]["response"]>>;

/**
 * @ignored
 * @since 1.0.0
 */
export type Handler<R = any> = {
  fn: (request: Request) => Effect.Effect<R, unknown, Response>;

  endpoint: Endpoint;
};

/**
 * @ignored
 * @since 1.0.0
 */
export type ApiToServer<A extends Api> = A extends Api<infer Es>
  ? Server<never, Es, A>
  : never;

/**
 * @ignored
 * @since 1.0.0
 */
export type DropEndpoint<
  Es extends Endpoint[],
  Id extends string,
> = Es extends [infer First, ...infer Rest]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : [];

/**
 * @ignored
 * @since 1.0.0
 */
export type ServerUnimplementedIds<S extends Server<any>> =
  S["_unimplementedEndpoints"][number]["id"];

/** @ignored */
type AddServerDependency<S extends Server<any>, R> = S extends Server<
  infer R0,
  infer E,
  infer A
>
  ? Server<R0 | R, E, A>
  : never;

/**
 * @ignored
 * @since 1.0.0
 */
export type AddServerHandle<
  S extends Server<any>,
  Id extends ServerUnimplementedIds<S>,
  R,
> = S extends Server<infer R0, infer E, infer A>
  ? Server<R0 | R, DropEndpoint<E, Id>, A>
  : never;

/**
 * @ignored
 * @since 1.0.0
 */
export type HandlerResponse<S extends Schema.Schema<any, any>> =
  S extends Schema.Schema<any, infer Body> ? Response | Body : never;

/**
 * Create new unimplemeted `Server` from `Api`.
 *
 * @category constructors
 * @since 1.0.0
 */
export const server: <A extends Api>(api: A) => ApiToServer<A> =
  internal.server;

/**
 * Implement handler for the given operation id.
 *
 * @category combinators
 * @since 1.0.0
 */
export const handle: <
  S extends Server<any>,
  Id extends ServerUnimplementedIds<S>,
  R,
>(
  id: Id,
  fn: InputHandlerFn<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>,
) => (api: S) => AddServerHandle<S, Id, R> = internal.handle;

/**
 * Make sure that all the endpoints are implemented
 *
 * @category combinators
 * @since 1.0.0
 */
export const exhaustive = <R, A extends Api>(
  server: Server<R, [], A>,
): Server<R, [], A> => server;

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
 * type GetMilanInput = Http.Input<typeof api, "getMilan">
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
> = EndpointSchemasToInput<
  Extract<A["endpoints"][number], { id: Id }>["schemas"]
>;

/**
 * @category extensions
 * @since 1.0.0
 */
export const prependExtension =
  <R, S extends Server<any>>(
    extension: Extension<R>,
    options?: Partial<ServerExtensionOptions<S["api"]["endpoints"]>>,
  ) =>
  (server: S): AddServerDependency<S, R> =>
    ({
      ...server,
      extensions: [
        internal.createServerExtention(extension, options),
        ...server.extensions,
      ],
    } as unknown as AddServerDependency<S, R>);

/**
 * @category extensions
 * @since 1.0.0
 */
export const addExtension =
  <R, S extends Server<any>>(
    extension: Extension<R>,
    options?: Partial<ServerExtensionOptions<S["api"]["endpoints"]>>,
  ) =>
  (server: S): AddServerDependency<S, R> =>
    ({
      ...server,
      extensions: [
        ...server.extensions,
        internal.createServerExtention(extension, options),
      ],
    } as unknown as AddServerDependency<S, R>);
