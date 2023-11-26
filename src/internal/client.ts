import * as PlatformClient from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as Api from "effect-http/Api";
import * as ClientRequestEncoder from "effect-http/internal/clientRequestEncoder";
import * as ClientResponseParser from "effect-http/internal/clientResponseParser";
import * as Effect from "effect/Effect";
import { identity, pipe } from "effect/Function";
import type * as Client from "effect-http/Client";

/** @internal */
const httpClient = PlatformClient.fetch();

export const endpointClient = <
  Endpoints extends Api.Endpoint,
  Id extends Endpoints["id"],
>(
  id: Id,
  api: Api.Api<Endpoints>,
  options: Partial<Client.Options>,
): Client.EndpointClient<Extract<Endpoints, { id: Id }>> => {
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
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make = <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>,
): Client.Client<Endpoints> =>
  api.endpoints.reduce(
    (client, endpoint) => ({
      ...client,
      [endpoint.id]: endpointClient(endpoint.id, api, options ?? {}),
    }),
    {} as Client.Client<Endpoints>,
  );
