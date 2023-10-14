/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import { HttpClient } from "@effect/platform";
import { Schema } from "@effect/schema";
import { Effect, Pipeable, type Types, pipe } from "effect";
import * as Api from "effect-http/Api";
import type * as ClientError from "effect-http/ClientError";
import type {
  EndpointSchemasTo,
  ResponseSchemaFullTo,
  SelectEndpointById,
} from "effect-http/ServerBuilder";
import * as ClientRequestEncoder from "effect-http/internal/clientRequestEncoder";
import * as ClientResponseParser from "effect-http/internal/clientResponseParser";

/**
 * @category models
 * @since 1.0.0
 */
export type Client<A extends Api.Api, H> = A extends Api.Api<infer Es>
  ? {
      [Id in Es[number]["id"]]: EndpointClient<A, Id, H>;
    } & Pipeable.Pipeable
  : never;

/**
 * @category models
 * @since 1.0.0
 */
export interface ClientOptions<H extends Record<string, unknown>> {
  headers: H;
}

/** @internal */
const httpClient = HttpClient.client.fetch();

export const endpointClient = <
  A extends Api.Api,
  Id extends A["endpoints"][number]["id"],
  H extends Record<string, unknown>,
>(
  id: Id,
  api: A,
  baseUrl: URL | string,
  options?: ClientOptions<H>,
): EndpointClient<A, Id, H> => {
  const endpoint = Api.getEndpoint(api, id);
  const responseParser = ClientResponseParser.create(endpoint.schemas.response);
  const requestEncoder = ClientRequestEncoder.create(
    baseUrl,
    endpoint,
    options?.headers,
  );

  return (args: unknown) =>
    pipe(
      requestEncoder.encodeRequest(args),
      Effect.flatMap(httpClient),
      Effect.flatMap(responseParser.parseResponse),
      Effect.annotateLogs("clientOperationId", endpoint.id),
    ) as any;
};

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const client = <
  A extends Api.Api,
  H extends Record<string, unknown> = Record<never, never>,
>(
  api: A,
  baseUrl: string | URL,
  options?: ClientOptions<H>,
): Client<A, H> =>
  api.endpoints.reduce(
    (client, endpoint) => {
      return {
        ...client,
        [endpoint.id]: endpointClient(endpoint.id, api, baseUrl, options),
      };
    },
    {} as Client<A, H>,
  );

// Internal type helpers

/** @ignore */
type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Types.Simplify<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;

/** @ignore */
type DropCommonHeaders<I, CommonHeaders> = Types.Simplify<{
  [K in keyof I]: K extends "headers"
    ? Types.Simplify<
        {
          [HK in Extract<keyof I[K], keyof CommonHeaders>]?: I[K][HK];
        } & Pick<I[K], Exclude<keyof I[K], keyof CommonHeaders>>
      >
    : I[K];
}>;

/** @ignore */
export type ClientFunctionResponse<
  S extends Api.Endpoint["schemas"]["response"],
> = Types.Simplify<
  S extends Schema.Schema<any, infer A>
    ? A
    : S extends readonly Api.ResponseSchemaFull[]
    ? ResponseSchemaFullTo<S[number]>
    : S extends Api.ResponseSchemaFull
    ? ResponseSchemaFullTo<S>
    : never
>;

/** @ignore */
type ClientFunction<Es extends Api.Endpoint[], Id, I> = Record<
  string,
  never
> extends I
  ? (
      input?: I,
    ) => Effect.Effect<
      never,
      ClientError.ClientError,
      ClientFunctionResponse<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >
  : (
      input: I,
    ) => Effect.Effect<
      never,
      ClientError.ClientError,
      ClientFunctionResponse<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >;

/** @ignore */
type EndpointClient<A extends Api.Api, Id, H> = ClientFunction<
  A["endpoints"],
  Id,
  MakeHeadersOptionIfAllPartial<
    DropCommonHeaders<
      EndpointSchemasTo<
        SelectEndpointById<A["endpoints"], Id>["schemas"]
      >["request"],
      H
    >
  >
>;
