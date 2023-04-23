import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { AnyApi, Api } from "../Api";
import * as internal from "../internal/client";
import type {
  EndpointSchemasToInput,
  SelectEndpointById,
} from "../internal/utils";
import type { ClientError } from "./Errors";

export type Client<A extends AnyApi> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]["id"]]: (
        input: EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
      ) => Effect.Effect<
        never,
        ClientError,
        Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
      >;
    }>
  : never;

/** Derive client implementation from the `Api` */
export const client: (baseUrl: URL) => <A extends AnyApi>(api: A) => Client<A> =
  internal.client;
