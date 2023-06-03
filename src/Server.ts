/**
 * @since 1.0.0
 */
import type * as Context from "@effect/data/Context";
import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { AnyApi, Api, Endpoint } from "effect-http/Api";
import type { ApiError } from "effect-http/ServerError";
import * as internal from "effect-http/internal/server";

/**
 * @category symbols
 * @since 1.0.0
 */
export const ServerId = Symbol("effect-http/Server/Server");

/**
 * @category models
 * @since 1.0.0
 */
export type ServerId = typeof ServerId;

/**
 * @category models
 * @since 1.0.0
 */
export type AnyServer = Server<any, Endpoint[]>;

/**
 * @category models
 * @since 1.0.0
 */
export type Server<
  R,
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
> = {
  readonly [ServerId]: {
    readonly _R: (_: never) => R;
  };

  _unimplementedEndpoints: UnimplementedEndpoints;

  handlers: Handler<R>[];
  api: Api;
};

/** @ignored */
type NonIgnoredFields<K extends keyof A, A> = K extends any
  ? A[K] extends
      | Schema.Schema<any, any>
      | Record<string, Schema.Schema<any, any>>
    ? K
    : never
  : never;

/**
 * @category models
 * @since 1.0.0
 */
export type RemoveIgnoredSchemas<E> = Pick<E, NonIgnoredFields<keyof E, E>>;

/** @ignored */
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
 * @category models
 * @since 1.0.0
 */
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<
  Es[number],
  { id: Id }
>;

/**
 * @category models
 * @since 1.0.0
 */
export type EndpointSchemasToInput<E extends Endpoint["schemas"]> =
  Schema.Spread<SchemaStructTo<RemoveIgnoredSchemas<Omit<E, "response">>>>;

/**
 * @category models
 * @since 1.0.0
 */
export type InputHandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E["schemas"]>,
) => Effect.Effect<R, ApiError, HandlerResponse<E["schemas"]["response"]>>;

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerInput<Q, P, H, B> = {
  query: Q;
  params: P;
  headers: H;
  body: B;
};

/**
 * @category models
 * @since 1.0.0
 */
export type Handler<R = any> = {
  fn: (request: Request) => Effect.Effect<R, never, Response>;

  endpoint: Endpoint;
};

/**
 * @category models
 * @since 1.0.0
 */
export type ProvideService<
  S extends AnyServer,
  T extends Context.Tag<any, any>,
> = S extends Server<infer R, infer E>
  ? Server<Exclude<R, Context.Tag.Identifier<T>>, E>
  : never;

/**
 * @category models
 * @since 1.0.0
 */
export type ApiToServer<A extends AnyApi> = A extends Api<infer Es>
  ? Server<never, Es>
  : never;

/**
 * @category models
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
 * @category models
 * @since 1.0.0
 */
export type ServerUnimplementedIds<S extends AnyServer> =
  S["_unimplementedEndpoints"][number]["id"];

/**
 * @category models
 * @since 1.0.0
 */
export type AddServerHandle<
  S extends AnyServer,
  Id extends ServerUnimplementedIds<S>,
  R,
> = S extends Server<infer R0, infer E>
  ? Server<R0 | R, DropEndpoint<E, Id>>
  : never;

/**
 * @category models
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
export const server: <A extends AnyApi>(api: A) => ApiToServer<A> =
  internal.server;

/**
 * Implement handler for the given operation id.
 *
 * @category combinators
 * @since 1.0.0
 */
export const handle: <
  S extends AnyServer,
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
export const exhaustive = <R>(server: Server<R, []>): Server<R, []> => server;

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