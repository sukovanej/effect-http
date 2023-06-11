/**
 * `Client` implementation derivation for testing purposes.
 *
 * @since 1.0.0
 */
import * as Schema from "@effect/schema/Schema";

import type { Api } from "effect-http/Api";
import type { Client, ClientOptions } from "effect-http/Client";
import * as internal from "effect-http/internal/mock-client";

/**
 * @category models
 * @since 1.0.0
 */
export type MockClientOptions<A extends Api> = {
  responses: {
    [Id in A["endpoints"][number]["id"]]: Schema.To<
      Extract<A["endpoints"][number], { id: Id }>["schemas"]["response"]
    >;
  };
};

/**
 * Derive mock client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const mockClient: <A extends Api, H extends Record<string, unknown>>(
  option?: Partial<MockClientOptions<A> & ClientOptions<H>>,
) => (api: A) => Client<A, H> = internal.mockClient;
