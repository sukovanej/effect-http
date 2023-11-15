/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import * as PlatformClient from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as Schema from "@effect/schema/Schema";
import * as Api from "effect-http/Api";
import type * as ClientError from "effect-http/ClientError";
import type * as Route from "effect-http/Route";
import * as ClientRequestEncoder from "effect-http/internal/clientRequestEncoder";
import * as ClientResponseParser from "effect-http/internal/clientResponseParser";
import * as Effect from "effect/Effect";
import { identity, pipe } from "effect/Function";
import * as Pipeable from "effect/Pipeable";
import type * as Types from "effect/Types";

/**
 * @category models
 * @since 1.0.0
 */
export type Client<Endpoints extends Api.Endpoint> = {
  [Id in Endpoints["id"]]: EndpointClient<Extract<Endpoints, { id: Id }>>;
} & Pipeable.Pipeable;

/** @internal */
const httpClient = PlatformClient.fetch();

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
): EndpointClient<Extract<Endpoints, { id: Id }>> => {
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
type ClientFunction<Endpoint extends Api.Endpoint, I> = Record<
  string,
  never
> extends I
  ? (
      input?: I,
    ) => Effect.Effect<
      never,
      ClientError.ClientError,
      ClientFunctionResponse<Endpoint["schemas"]["response"]>
    >
  : (
      input: I,
    ) => Effect.Effect<
      never,
      ClientError.ClientError,
      ClientFunctionResponse<Endpoint["schemas"]["response"]>
    >;

/** @ignore */
type EndpointClient<Endpoint extends Api.Endpoint> = ClientFunction<
  Endpoint,
  MakeHeadersOptionIfAllPartial<
    Route.EndpointSchemasTo<Endpoint["schemas"]>["request"]
  >
>;
