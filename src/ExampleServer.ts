import type { Api } from "./Api";
import type { Server } from "./Server";
import * as internal from "./internal/example-server";

/** Generate an example Server implementation. */
export const exampleServer: (api: Api) => Server<never, []> =
  internal.exampleServer;
