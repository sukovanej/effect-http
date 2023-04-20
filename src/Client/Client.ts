import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint } from "../Api";
import * as internal from "../internal/client";
import type {
  EndpointSchemasToInput,
  SelectEndpointById,
} from "../internal/utils";
import type { ClientError } from "./Errors";

export type Client<Es extends Endpoint[]> = Schema.Spread<{
  [Id in Es[number]["id"]]: (
    input: EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
  ) => Effect.Effect<
    never,
    ClientError,
    Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
  >;
}>;

/** Derive client implementation from the `Api` */
export const client: (
  baseUrl: URL,
) => <Es extends Endpoint[]>(api: Api<Es>) => Client<Es> = internal.client;
