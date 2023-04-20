import type * as Context from "@effect/data/Context";
import type * as Effect from "@effect/io/Effect";
import type * as Layer from "@effect/io/Layer";
import type * as Logger from "@effect/io/Logger";
import type * as Schema from "@effect/schema/Schema";

import type { AnyApi, Api, Endpoint } from "../Api";
import * as internal from "../internal/server";
import type {
  EndpointSchemasToInput,
  SelectEndpointById,
} from "../internal/utils";
import type { ValidationErrorFormatter } from "../validation-error-formatter";
import type { ApiError } from "./Errors";

export type AnyServer = Server<Endpoint[], Handler[]>;

export type Server<
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
  Handlers extends Handler[] = Handler[],
> = {
  _unimplementedEndpoints: UnimplementedEndpoints;

  handlers: Handlers;
  api: Api;

  logger: Logger.Logger<any, any>;
  validationErrorFormatter: ValidationErrorFormatter;
};

export type Handler<E extends Endpoint = Endpoint, R = any> = {
  fn: (
    input: EndpointSchemasToInput<E["schemas"]>,
  ) => Effect.Effect<R, ApiError, Schema.To<E["schemas"]["response"]>>;

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
  fn: Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>["fn"],
) => (
  api: S,
) => internal.AddServerHandle<
  S,
  Id,
  Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>
> = internal.handle;

/** Provide layer for all handlers defined so far. */
export const provideLayer: <R0, R>(
  layer: Layer.Layer<R0, ApiError, R>,
) => <Es extends Endpoint[], Hs extends Handler[]>(
  api: Server<Es, Hs>,
) => Server<Es, internal.ProvideLayer<Hs, R0, R>> = internal.provideLayer;

/** Provide service for all handlers defined so far.
 *
 * Effectively calls `Effect.provideService` on all handler functions.
 **/
export const provideService: <T extends Context.Tag<any, any>>(
  tag: T,
  service: Context.Tag.Service<T>,
) => <Es extends Endpoint[], Hs extends Handler[]>(
  api: Server<Es, Hs>,
) => Server<Es, internal.ProvideService<Hs, T>> = internal.provideService;

/** Make sure that
 *  - all the endpoints are implemented
 *  - all handlers contexts are resolved
 */
export const exhaustive = <S extends Server<[], Handler<any, never>[]>>(
  server: S,
) => server;

/** Set the server logger which will apply for both out-of-box logs and
 * handler logs.
 *
 * You can either provide an instance of `Logger.Logger<I, O>` or
 * use `"default"`, `"pretty"`, `"json"` or `"none"` shorthands.
 *
 * @example
 * const server = pipe(
 *   api,
 *   Http.server,
 *   Http.setLogger("json")
 * );
 *
 * @param logger Logger.Logger<I, O> | "default" | "pretty" | "json" | "none"
 */
export const setLogger: <I, O>(
  logger: Logger.Logger<I, O> | "default" | "pretty" | "json" | "none",
) => <S extends AnyServer>(server: S) => S = internal.setLogger;

/** Type-helper providing type of a handler input given the type of the
 * Api `A` and operation id `Id`.
 *
 * @example
 * const api = pipe(
 *   Http.api(),
 *   Http.get("getMilan", "/milan", { response: S.string, query: S.string })
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
