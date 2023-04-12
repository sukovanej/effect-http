import * as OpenApi from "schema-openapi";

import * as Context from "@effect/data/Context";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Logger from "@effect/io/Logger";
import * as S from "@effect/schema/Schema";

import { Api, Endpoint } from "./api";
import { ApiError } from "./errors";
import { EndpointSchemasToInput, SelectEndpointById } from "./internal";

export type Server<
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
  Handlers extends Handler[] = Handler[],
> = {
  _unimplementedEndpoints: UnimplementedEndpoints;

  openApi: OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>;
  handlers: Handlers;

  logger: Logger.Logger<any, any>;
};

export type Body<Body> = S.Spread<{ body: Body }>;
export type Query<Query> = S.Spread<{ query: Query }>;

export type Handler<E extends Endpoint = Endpoint, R = any> = {
  fn: (
    input: EndpointSchemasToInput<E["schemas"]>,
  ) => Effect.Effect<R, ApiError, S.To<E["schemas"]["response"]>>;

  endpoint: E;
  layer?: Layer.Layer<any, ApiError, any>;
};

export const server =
  (title: string, version: string = "1.0.0") =>
  <A extends Endpoint[]>(api: Api<A>): Server<A, []> => ({
    _unimplementedEndpoints: api,

    openApi: OpenApi.openAPI(title, version),
    handlers: [],
    logger: Logger.defaultLogger,
  });

type DropEndpoint<Es extends Endpoint[], Id extends string> = Es extends [
  infer First,
  ...infer Rest,
]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : [];

export const handle =
  <
    S extends Server<Endpoint[], Handler[]>,
    const Id extends S["_unimplementedEndpoints"][number]["id"],
    R,
  >(
    id: Id,
    fn: Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>["fn"],
  ) =>
  (
    api: S,
  ): Server<
    DropEndpoint<S["_unimplementedEndpoints"], Id>,
    [
      ...S["handlers"],
      Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>,
    ]
  > => ({
    ...api,
    _unimplementedEndpoints: api._unimplementedEndpoints.filter(
      ({ id: _id }) => _id !== id,
    ) as DropEndpoint<S["_unimplementedEndpoints"], Id>,
    handlers: [
      ...api.handlers,
      {
        fn,
        endpoint: api._unimplementedEndpoints.find(
          ({ id: _id }) => _id === id,
        )!,
      },
    ] as [
      ...S["handlers"],
      Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>,
    ],
  });

type ProvideLayer<Hs extends Handler[], R0, R> = Hs extends [
  Handler<infer E, infer _R>,
  ...infer Rest,
]
  ? [
      Handler<E, _R extends R ? R0 : _R>,
      ...(Rest extends Handler[] ? ProvideLayer<Rest, R0, R> : never),
    ]
  : [];

export const provideLayer =
  <R0, R>(layer: Layer.Layer<R0, ApiError, R>) =>
  <Es extends Endpoint[], Hs extends Handler[]>(
    api: Server<Es, Hs>,
  ): Server<Es, ProvideLayer<Hs, R0, R>> => ({
    ...api,
    handlers: api.handlers.map((handler) => ({
      ...handler,
      fn: (i: any) => Effect.provideLayer(handler.fn(i), layer),
    })) as ProvideLayer<Hs, R0, R>,
  });

type ProvideService<
  Hs extends Handler[],
  T extends Context.Tag<any, any>,
> = Hs extends [Handler<infer E, infer R>, ...infer Rest]
  ? [
      Handler<E, Exclude<R, Context.Tag.Identifier<T>>>,
      ...(Rest extends Handler[] ? ProvideService<Rest, T> : never),
    ]
  : [];

export const provideService =
  <T extends Context.Tag<any, any>>(tag: T, service: Context.Tag.Service<T>) =>
  <Es extends Endpoint[], Hs extends Handler[]>(
    api: Server<Es, Hs>,
  ): Server<Es, ProvideService<Hs, T>> => ({
    ...api,
    handlers: api.handlers.map((handler) => ({
      ...handler,
      fn: (i: any) => Effect.provideService(handler.fn(i), tag, service),
    })) as ProvideService<Hs, T>,
  });

export const exhaustive = <S extends Server<[], Handler<any, never>[]>>(
  server: S,
) => server;

export const setLogger =
  <I, O>(logger: Logger.Logger<I, O>) =>
  <S extends Server>(server: S) => ({ ...server, logger });

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
  Id extends A[number]["id"],
> = EndpointSchemasToInput<Extract<A[number], { id: Id }>["schemas"]>;
