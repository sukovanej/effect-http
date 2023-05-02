import * as Schema from "@effect/schema/Schema";

import type { AnyApi } from "./Api";
import type { Client } from "./Client";
import * as internal from "./internal/mock-client";

export type MockClientOptions<A extends AnyApi> = {
  responses: {
    [Id in A["endpoints"][number]["id"]]: Schema.To<
      Extract<A["endpoints"][number], { id: Id }>["schemas"]["response"]
    >;
  };
};

/** Derive mock client implementation from the `Api` */
export const mockClient: <A extends AnyApi>(
  option?: Partial<MockClientOptions<A>>,
) => (api: A) => Client<A> = internal.mockClient;
