/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import { HttpClient } from "@effect/platform";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import { Schema } from "@effect/schema";
import { Effect, Pipeable, type Types, identity, pipe } from "effect";
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
  options: Partial<Options>,
): EndpointClient<Endpoints, Id> => {
  const endpoint = Api.getEndpoint(api, id);
  const responseParser = ClientResponseParser.create(endpoint.schemas.response);
  const requestEncoder = ClientRequestEncoder.create(endpoint);

  let mapRequest = options.mapRequest ?? identity;

  if (options.baseUrl) {
    const url =
      typeof options.baseUrl === "string"
        ? options.baseUrl
        : options.baseUrl.toString();
    mapRequest = ClientRequest.prependUrl(url);
  }

  return (args: unknown) =>
    pipe(
      requestEncoder.encodeRequest(args),
      Effect.map(mapRequest),
      Effect.flatMap(httpClient),
      Effect.flatMap(responseParser.parseResponse),
      Effect.annotateLogs("clientOperationId", endpoint.id),
    ) as any;
};

/**
 * @category models
 * @since 1.0.0
 */
export interface Options {
  mapRequest?: (
    request: ClientRequest.ClientRequest,
  ) => ClientRequest.ClientRequest;
  baseUrl: URL | string;
}

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make = <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  options?: Partial<Options>,
): Client<Endpoints> =>
  api.endpoints.reduce(
    (client, endpoint) => ({
      ...client,
      [endpoint.id]: endpointClient(endpoint.id, api, options ?? {}),
    }),
    {} as Client<Endpoints>,
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
