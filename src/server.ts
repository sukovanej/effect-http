import * as OpenApi from "schema-openapi";

import * as Context from "@effect/data/Context";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as S from "@effect/schema/Schema";

import { Api, Endpoint } from "./api";
import { ApiError } from "./errors";
import { EndpointSchemasToInput } from "./internal";

export type Server<
  UnimplementedEndpoints extends Endpoint[] = Endpoint[],
  Handlers extends Handler[] = Handler[],
> = {
  _unimplementedEndpoints: UnimplementedEndpoints;

  openApi: OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>;
  handlers: Handlers;
};

export type Body<Body> = S.Spread<{ body: Body }>;
export type Query<Query> = S.Spread<{ query: Query }>;

export type Handler<E extends Endpoint = Endpoint, R = any> = {
  fn: (
    input: EndpointSchemasToInput<E["schemas"]>,
  ) => Effect.Effect<R, ApiError, S.To<E["schemas"]["response"]>>;

  endpoint: E;
};

export const server =
  (title: string, version: string) =>
  <A extends Endpoint[]>(api: Api<A>): Server<A, []> => ({
    _unimplementedEndpoints: api,

    openApi: OpenApi.openAPI(title, version),
    handlers: [],
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
    fn: Handler<
      Extract<S["_unimplementedEndpoints"][number], { id: Id }>,
      R
    >["fn"],
  ) =>
  (
    api: S,
  ): Server<
    DropEndpoint<S["_unimplementedEndpoints"], Id>,
    [
      ...S["handlers"],
      Handler<Extract<S["_unimplementedEndpoints"][number], { id: Id }>, R>,
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
      Handler<Extract<S["_unimplementedEndpoints"][number], { id: Id }>, R>,
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
      fn: (input: any) => Effect.provideLayer(handler.fn(input), layer),
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
      fn: (input: any) =>
        Effect.provideService(handler.fn(input), tag, service),
    })) as ProvideService<Hs, T>,
  });
