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
import type * as Route from "effect-http/Route";
import * as ClientRequestEncoder from "effect-http/internal/clientRequestEncoder";
import * as ClientResponseParser from "effect-http/internal/clientResponseParser";

/**
 * @category models
 * @since 1.0.0
 */
export type Client<Endpoints extends Api.Endpoint> = {
  [Id in Endpoints["id"]]: EndpointClient<Endpoints, Id>;
} & Pipeable.Pipeable;

/** @internal */
const httpClient = HttpClient.client.fetch();

/**
 * @category constructors
 * @since 1.0.0
 */
export const endpointClient = <
  Endpoints extends Api.Endpoint,
  Id extends Endpoints["id"],
>(
  id: Id,
  api: Api.Api<Endpoints>,
  baseUrl: URL | string,
): EndpointClient<Endpoints, Id> => {
  const endpoint = Api.getEndpoint(api, id);
  const responseParser = ClientResponseParser.create(endpoint.schemas.response);
  const requestEncoder = ClientRequestEncoder.create(baseUrl, endpoint);

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
export const client = <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  baseUrl: string | URL,
): Client<Endpoints> =>
  api.endpoints.reduce((client, endpoint) => {
    return {
      ...client,
      [endpoint.id]: endpointClient(endpoint.id, api, baseUrl),
    };
  }, {} as Client<Endpoints>);

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
export type ClientFunctionResponse<
  S extends Api.Endpoint["schemas"]["response"],
> = Types.Simplify<
  S extends Schema.Schema<any, infer A>
    ? A
    : S extends readonly Api.ResponseSchemaFull[]
      ? Route.ResponseSchemaFullTo<S[number]>
      : S extends Api.ResponseSchemaFull
        ? Route.ResponseSchemaFullTo<S>
        : never
>;

/** @ignore */
type ClientFunction<Es extends Api.Endpoint, Id, I> = Record<
  string,
  never
> extends I
  ? (
      input?: I,
    ) => Effect.Effect<
      never,
      ClientError.ClientError,
      ClientFunctionResponse<Extract<Es, { id: Id }>["schemas"]["response"]>
    >
  : (
      input: I,
    ) => Effect.Effect<
      never,
      ClientError.ClientError,
      ClientFunctionResponse<Extract<Es, { id: Id }>["schemas"]["response"]>
    >;

/** @ignore */
type EndpointClient<Endpoints extends Api.Endpoint, Id> = ClientFunction<
  Endpoints,
  Id,
  MakeHeadersOptionIfAllPartial<
    Route.EndpointSchemasTo<
      Extract<Endpoints, { id: Id }>["schemas"]
    >["request"]
  >
>;
