/**
 * @since 1.0.0
 */
import type { Api } from "effect-http/Api";
import type { Server } from "effect-http/Server";
import * as internal from "effect-http/internal/example-server";

/**
 * Generate an example Server implementation.
 *
 * @category constructors
 * @since 1.0.0
 */
export const exampleServer: (api: Api) => Server<never, []> =
  internal.exampleServer;
