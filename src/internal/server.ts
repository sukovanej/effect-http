import type { AnyApi } from "../Api";
import type {
  AddServerHandle,
  AnyServer,
  ApiToServer,
  Handler,
  ServerUnimplementedIds,
} from "../Server";
import { ServerId } from "../Server";
import type { SelectEndpointById } from "./utils";

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

/** @internal */
export const handle =
  <S extends AnyServer, Id extends ServerUnimplementedIds<S>, R>(
    id: Id,
    fn: Handler<SelectEndpointById<S["_unimplementedEndpoints"], Id>>["fn"],
  ) =>
  (api: S): AddServerHandle<S, Id, R> => {
    const endpoint = api._unimplementedEndpoints.find(
      ({ id: _id }) => _id === id,
    );

    if (endpoint === undefined) {
      throw new Error(`Operation id ${id} not found`);
    }

    const newUnimplementedEndpoints = api._unimplementedEndpoints.filter(
      ({ id: _id }) => _id !== id,
    );

    const handler = { fn, endpoint };

    return {
      ...api,
      _unimplementedEndpoints: newUnimplementedEndpoints,
      handlers: [...api.handlers, handler],
    } as unknown as AddServerHandle<S, Id, R>;
  };
