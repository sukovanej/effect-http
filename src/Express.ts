import type { Express } from "express";
import type http from "http";

import type * as Effect from "@effect/io/Effect";
import type * as Logger from "@effect/io/Logger";

import type { Server } from "./Server";
import * as internal from "./internal/express";

export type ExpressOptions = {
  /** Controls whether to expose OpenAPI UI or not. */
  openapiEnabled: boolean;

  /** Which path should be the OpenAPI UI exposed on. */
  openapiPath: string;

  /** Set logger.
   *
   *  The value can be either an instance of `Logger.Logger<I, O>` or
   *  one of `"default"`, `"pretty"`, `"json"` or `"none"` shorthands.
   *
   *  @default "pretty"
   */
  logger: Logger.Logger<any, any> | "none" | "default" | "pretty" | "json";
};

/** Create express app from the `Server` */
export const express: <R>(
  options?: Partial<ExpressOptions>,
) => (server: Server<R, []>) => Effect.Effect<R, unknown, Express> =
  internal.toExpress;

export type ListenOptions = {
  /** Port to listen on
   *
   *  By default, any available port will be used.
   *
   *  @default undefined
   */
  port: number | undefined;

  /** Run effect after server starts. */
  onStart?: (server: http.Server) => Effect.Effect<never, any, any>;
} & ExpressOptions;

/** Create an express app from the `Server` and start the server */
export const listen: (
  options?: Partial<ExpressOptions & ListenOptions>,
) => <R>(server: Server<R, []>) => Effect.Effect<R, unknown, void> =
  internal.listen;

/** Start the server from an express app */
export const listenExpress: (
  options?: Partial<ExpressOptions & ListenOptions>,
) => (express: Express) => Effect.Effect<never, unknown, void> =
  internal.listenExpress;
