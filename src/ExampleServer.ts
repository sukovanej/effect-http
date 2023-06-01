import type { Api } from "effect-http/Api";
import type { Server } from "effect-http/Server/Server";
import * as internal from "effect-http/internal/example-server";

/** Generate an example Server implementation. */
export const exampleServer: (api: Api) => Server<never, []> =
  internal.exampleServer;
