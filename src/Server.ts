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
import type { Extension } from "effect-http/Extensions";
import type { ApiError } from "effect-http/ServerError";
import * as internal from "effect-http/internal/server";

import type { ResponseUtil } from "./Utils";

/**
 * @category models
 * @since 1.0.0
 */
export type Server<
  R,
  Es extends Endpoint[] = Endpoint[],
  A extends Api = Api,
> = {
  unimplementedEndpoints: Es;
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
  fn: InputHandlerFn<SelectEndpointById<S["unimplementedEndpoints"], Id>, R>,
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
  InputHandlerFn<Extract<A["endpoints"][number], { id: Id }>, never>
>[0];

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
    }) as unknown as AddServerDependency<S, R>;

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
    }) as unknown as AddServerDependency<S, R>;

// Internal type helpers

/** @ignore */
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;

/** @ignore */
type ConvertToInput<E> = E extends Schema.Schema<any, infer A>
  ? A
  : E extends Record<string, any>
  ? { [K in RequiredFields<E, keyof E>]: ConvertToInput<E[K]> }
  : E;

/** @ignore */
type RequiredFields<E, K extends keyof E> = K extends any
  ? E[K] extends IgnoredSchemaId
    ? never
    : K
  : never;

/** @ignore */
export type EndpointSchemasToInput<E extends Endpoint["schemas"]> =
  Schema.Spread<ConvertToInput<Omit<E, "response">>>;

/** @ignore */
export type InputHandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E["schemas"]> & {
    ResponseUtil: ResponseUtil<E>;
  },
) => Effect.Effect<R, ApiError, HandlerResponse<E["schemas"]["response"]>>;

/** @ignore */
export type Handler<R = any> = {
  fn: (request: Request) => Effect.Effect<R, unknown, Response>;

  endpoint: Endpoint;
};

/** @ignore */
export type ApiToServer<A extends Api> = A extends Api<infer Es>
  ? Server<never, Es, A>
  : never;

/** @ignore */
export type DropEndpoint<
  Es extends Endpoint[],
  Id extends string,
> = Es extends [infer First, ...infer Rest]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : [];

/** @ignore */
export type ServerUnimplementedIds<S extends Server<any>> =
  S["unimplementedEndpoints"][number]["id"];

/** @ignore */
type AddServerDependency<S extends Server<any>, R> = S extends Server<
  infer R0,
  infer E,
  infer A
>
  ? Server<R0 | R, E, A>
  : never;

/** @ignore */
export type AddServerHandle<
  S extends Server<any>,
  Id extends ServerUnimplementedIds<S>,
  R,
> = S extends Server<infer R0, infer E, infer A>
  ? Server<R0 | R, DropEndpoint<E, Id>, A>
  : never;

/** @ignore */
export type HandlerResponse<S> = S extends Schema.Schema<any, infer Body>
  ? Response | Body
  : S extends readonly ResponseSchemaFull[]
  ? ConvertToInput<S[number]>
  : never;
