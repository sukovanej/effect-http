import type { AnyApi } from "effect-http/Api";
import type { Client, ClientOptions } from "effect-http/Client/Client";
import * as internal from "effect-http/internal/mock-client";

import * as Schema from "@effect/schema/Schema";

export type MockClientOptions<A extends AnyApi> = {
  responses: {
    [Id in A["endpoints"][number]["id"]]: Schema.To<
      Extract<A["endpoints"][number], { id: Id }>["schemas"]["response"]
    >;
  };
};

/** Derive mock client implementation from the `Api` */
export const mockClient: <A extends AnyApi, H extends Record<string, unknown>>(
  option?: Partial<MockClientOptions<A> & ClientOptions<H>>,
) => (api: A) => Client<A, H> = internal.mockClient;
