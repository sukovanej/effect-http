import * as Log from "effect-log";

import * as Context from "@effect/data/Context";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Logger from "@effect/io/Logger";

import type { AnyApi, Api, Endpoint } from "../Api";
import type { AnyServer, ApiError, Handler, Server } from "../Server";
import { defaultValidationErrorFormatterServer } from "../validation-error-formatter";
import type { SelectEndpointById } from "./utils";

export type ProvideService<
  Hs extends Handler[],
  T extends Context.Tag<any, any>,
> = Hs extends [Handler<infer E, infer R>, ...infer Rest]
  ? [
      Handler<E, Exclude<R, Context.Tag.Identifier<T>>>,
      ...(Rest extends Handler[] ? ProvideService<Rest, T> : never),
    ]
  : [];

export type ApiToServer<A extends AnyApi> = A extends Api<infer A>
  ? Server<A, []>
  : never;

export type DropEndpoint<
  Es extends Endpoint[],
  Id extends string,
> = Es extends [infer First, ...infer Rest]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : [];

export type ServerUnimplementedIds<S extends AnyServer> =
  S["_unimplementedEndpoints"][number]["id"];

export type AddServerHandle<
  S extends AnyServer,
  Id extends ServerUnimplementedIds<S>,
  H extends Handler,
> = Server<
  DropEndpoint<S["_unimplementedEndpoints"], Id>,
  [...S["handlers"], H]
>;

/** @internal */
export const server = <A extends AnyApi>(api: A): ApiToServer<A> =>
  ({
    _unimplementedEndpoints: api.endpoints,
    api,

    handlers: [],
    logger: Log.pretty,
    validationErrorFormatter: defaultValidationErrorFormatterServer,
  } as unknown as ApiToServer<A>);

export const handle =
  <S extends AnyServer, Id extends ServerUnimplementedIds<S>, R>(
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

/** @internal */
const defaultLoggers = {
  default: Logger.defaultLogger,
  pretty: Log.pretty,
  json: Log.json(),
  none: Logger.none(),
};

/** @internal */
export const setLogger =
  <I, O>(loggerInput: Logger.Logger<I, O> | keyof typeof defaultLoggers) =>
  <S extends AnyServer>(server: S): S => {
    const logger =
      (typeof loggerInput === "string" && defaultLoggers[loggerInput]) ||
      loggerInput;

    return { ...server, logger };
  };

/** @internal */
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

export type ProvideLayer<Hs extends Handler[], R0, R> = Hs extends [
  Handler<infer E, infer _R>,
  ...infer Rest,
]
  ? [
      Handler<E, _R extends R ? R0 : _R>,
      ...(Rest extends Handler[] ? ProvideLayer<Rest, R0, R> : never),
    ]
  : [];

/** @internal */
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
