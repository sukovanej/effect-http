/**
 * `Client` implementation derivation for testing purposes.
 *
 * @since 1.0.0
 */
import type * as Api from "./Api.js";
import type * as Client from "./Client.js";
import * as internal from "./internal/mock-client.js";

/**
 * @category models
 * @since 1.0.0
 */
export type Options<Endpoints extends Api.Endpoint> = {
  responses: {
    [Id in Endpoints["id"]]: Client.ClientFunctionResponse<
      Extract<Endpoints, { id: Id }>["schemas"]["response"]
    >;
  };
};

/**
 * Derive mock client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  option?: Partial<Options<Endpoints>>,
) => Client.Client<Endpoints> = internal.make;
