import * as Context from "@effect/data/Context";

import type { AnyApi, Api, Endpoint } from "../Api";
import { AnyServer, Handler, Server, ServerId } from "../Server";
import type { SelectEndpointById } from "./utils";

export type ProvideService<
  S extends AnyServer,
  T extends Context.Tag<any, any>,
> = S extends Server<infer R, infer E>
  ? Server<Exclude<R, Context.Tag.Identifier<T>>, E>
  : never;

export type ApiToServer<A extends AnyApi> = A extends Api<infer A>
  ? Server<never, A>
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
  R,
> = S extends Server<infer R0, infer E>
  ? Server<R0 | R, DropEndpoint<E, Id>>
  : never;

/** @internal */
export const server = <A extends AnyApi>(api: A): ApiToServer<A> =>
  ({
    [ServerId]: {
      _R: (_: never) => _,
    },
    _unimplementedEndpoints: api.endpoints,
    api,

    handlers: [],
  } as unknown as ApiToServer<A>);

export const handle =
  <S extends AnyServer, Id extends ServerUnimplementedIds<S>, R>(
    id: Id,
    fn: Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>>["fn"],
  ) =>
  (api: S): AddServerHandle<S, Id, R> =>
    ({
      ...api,
      _unimplementedEndpoints: api._unimplementedEndpoints.filter(
        ({ id: _id }) => _id !== id,
      ),
      handlers: [
        ...api.handlers,
        {
          fn,
          endpoint: api._unimplementedEndpoints.find(
            ({ id: _id }) => _id === id,
          )!,
        },
      ],
    } as unknown as AddServerHandle<S, Id, R>);
