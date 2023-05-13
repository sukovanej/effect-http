import * as Schema from "@effect/schema/Schema";

import type { AnyApi } from "./Api";
import type { Client, ClientOptions } from "./Client";
import * as internal from "./internal/mock-client";

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
