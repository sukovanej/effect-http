import type { Express } from "express";
import type { AddressInfo } from "net";

import type * as Effect from "@effect/io/Effect";

import type { Endpoint } from "./Api";
import type { Handler, Server } from "./Server";
import * as internal from "./internal/express";

/** Create express app from the `Server` */
export const express: <Hs extends Handler<any, never>[]>(
  server: Server<[], Hs>,
) => Express = internal.toExpress;

/** Create express app from the `Server` and start listening on `port` */
export const listen: (
  port?: number,
) => <S extends Server<[], Handler<Endpoint, never>[]>>(
  server: S,
) => Effect.Effect<never, unknown, AddressInfo> = internal.listen;
