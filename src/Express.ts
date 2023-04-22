import type { Express } from "express";
import type { AddressInfo } from "net";

import type * as Effect from "@effect/io/Effect";

import type { Endpoint } from "./Api";
import type { Handler, Server } from "./Server";
import * as internal from "./internal/express";

export type ExpressOptions = {
  /** Controls whether to expose OpenAPI UI or not. */
  openapiEnabled: boolean;

  /** Which path should be the OpenAPI UI exposed on. */
  openapiPath: string;
};

/** Create express app from the `Server` */
export const express: (
  options?: Partial<ExpressOptions>,
) => <Hs extends Handler<any, never>[]>(server: Server<[], Hs>) => Express =
  internal.toExpress;

/** Create express app from the `Server` and start listening on `port` */
export const listen: (
  port?: number,
  options?: Partial<ExpressOptions>,
) => <S extends Server<[], Handler<Endpoint, never>[]>>(
  server: S,
) => Effect.Effect<never, unknown, AddressInfo> = internal.listen;
