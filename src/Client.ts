/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as HttpClient from "@effect/platform/Http/Client"
import type * as ClientRequest from "@effect/platform/Http/ClientRequest"
import type * as Schema from "@effect/schema/Schema"
import type * as Effect from "effect/Effect"
import type * as Types from "effect/Types"

import type * as Api from "./Api.js"
import type * as ClientError from "./ClientError.js"
import * as internal from "./internal/client.js"
import type * as Route from "./Route.js"

/**
 * @category models
 * @since 1.0.0
 */
export type Client<Endpoints extends Api.Endpoint> = {
  [Id in Endpoints["id"]]: EndpointClient<Extract<Endpoints, { id: Id }>>
}

/** @ignore */
export type EndpointClient<Endpoint extends Api.Endpoint> = ClientFunction<
  Endpoint,
  MakeHeadersOptionIfAllPartial<
    Route.EndpointSchemasTo<Endpoint["schemas"]>["request"]
  >
>

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  mapRequest?: (
    request: ClientRequest.ClientRequest
  ) => ClientRequest.ClientRequest
  httpClient?: HttpClient.Client.Default
  baseUrl: string
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const endpointClient: <
  Endpoints extends Api.Endpoint,
  Id extends Endpoints["id"]
>(
  id: Id,
  api: Api.Api<Endpoints>,
  options: Partial<Options>
) => EndpointClient<Extract<Endpoints, { id: Id }>> = internal.endpointClient

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  options?: Partial<Options>
) => Client<Endpoints> = internal.make

// Internal type helpers

/** @ignore */
type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any } ? Types.Simplify<
    & (Record<string, never> extends I["headers"] ? { headers?: I["headers"] }
      : Pick<I, "headers">)
    & Omit<I, "headers">
  >
  : I

/** @ignore */
export type ClientFunctionResponse<
  S extends Api.Endpoint["schemas"]["response"]
> = S extends Schema.Schema<any, any, infer A> ? A
  : S extends ReadonlyArray<Api.ResponseSchemaFull> ? Route.ResponseSchemaFullTo<S[number]>
  : S extends Api.ResponseSchemaFull ? Route.ResponseSchemaFullTo<S>
  : never

/** @ignore */
type ClientFunction<Endpoint extends Api.Endpoint, I> = Record<
  string,
  never
> extends I ? (
    input?: I
  ) => Effect.Effect<
    Api.EndpointRequirements<Endpoint>,
    ClientError.ClientError,
    ClientFunctionResponse<Endpoint["schemas"]["response"]>
  >
  : (
    input: I
  ) => Effect.Effect<
    Api.EndpointRequirements<Endpoint>,
    ClientError.ClientError,
    ClientFunctionResponse<Endpoint["schemas"]["response"]>
  >
