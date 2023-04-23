import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { AnyApi, Api, Endpoint } from "../Api";
import * as internal from "../internal/server";
import type {
  EndpointSchemasToInput,
  SelectEndpointById,
} from "../internal/utils";
import type { ApiError } from "./Errors";

export const ServerId = Symbol("effect-http/Server/Server");
export type ServerId = typeof ServerId;

export type AnyServer = Server<any, Endpoint[]>;

export type Server<
  R,
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
> = {
  readonly [ServerId]: {
    readonly _R: (_: never) => R;
  };

  _unimplementedEndpoints: UnimplementedEndpoints;

  handlers: Handler[];
  api: Api;
};

type HandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E["schemas"]>,
) => Effect.Effect<R, ApiError, Schema.To<E["schemas"]["response"]>>;

export type Handler<E extends Endpoint = Endpoint> = {
  fn: (
    input: EndpointSchemasToInput<E["schemas"]>,
  ) => Effect.Effect<any, ApiError, Schema.To<E["schemas"]["response"]>>;

  endpoint: E;
};

/** Create new unimplemeted `Server` from `Api`. */
export const server: <A extends AnyApi>(api: A) => internal.ApiToServer<A> =
  internal.server;

export const handle: <
  S extends AnyServer,
  Id extends internal.ServerUnimplementedIds<S>,
  R,
>(
  id: Id,
  fn: HandlerFn<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>,
) => (api: S) => internal.AddServerHandle<S, Id, R> = internal.handle;

/** Make sure that
 *  - all the endpoints are implemented
 *  - all handlers contexts are resolved
 */
export const exhaustive = <R>(server: Server<R, []>): Server<R, []> => server;

/** Type-helper providing type of a handler input given the type of the
 * Api `A` and operation id `Id`.
 *
 * @example
 * const api = pipe(
 *   Http.api(),
 *   Http.get("getMilan", "/milan", { response: Schema.string, query: Schema.string })
 * )
 *
 * type GetMilanInput = Http.Input<typeof api, "getMilan">
 * // -> { query: string }
 *
 * @param A Api type of the API
 * @param Id operation id
 */
export type Input<
  A extends Api,
  Id extends A["endpoints"][number]["id"],
> = EndpointSchemasToInput<
  Extract<A["endpoints"][number], { id: Id }>["schemas"]
>;
