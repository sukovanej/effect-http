import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import { Api, Endpoint, IgnoredSchemaId } from "./api";
import { ApiError } from "./errors";
import { EndpointSchemasToInput, SelectEndpointById } from "./internal";

export type HttpClientProviderOptions = {
  headers: Record<string, string>;
  body: unknown;
};

export const HttpClientProviderService =
  Context.Tag<
    (
      url: URL,
      options: HttpClientProviderOptions,
    ) => Effect.Effect<never, ApiError, unknown>
  >();

type Client<Es extends Endpoint[]> = S.Spread<{
  [Id in Es[number]["id"]]: (
    input: EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
  ) => Effect.Effect<
    never,
    ApiError,
    SelectEndpointById<Es, Id>["schemas"]["response"]
  >;
}>;

export const client =
  (baseUrl: URL) =>
  <Es extends Endpoint[]>(api: Api<Es>): Client<Es> =>
    api.reduce(
      (
        client,
        { id, method, path, schemas: { query, params, body, response } },
      ) => {
        const parseResponse = S.parseEffect(response);

        const fn = (args: any) => {
          const url = new URL(baseUrl);

          if (query !== IgnoredSchemaId) {
            const query = new URLSearchParams(args["query"]);

            for (const [k, v] of query.entries()) {
              url.searchParams.set(k, v);
            }
          }

          if (params !== IgnoredSchemaId) {
            // TODO: set params
            args["params"];
          }

          let requestBody = undefined;

          if (body !== IgnoredSchemaId) {
            requestBody = args["body"];
          }

          return pipe(
            Effect.logInfo(
              `${method} ${baseUrl}/${path} with ${JSON.stringify(body)}`,
            ),
            Effect.logAnnotate("clientOperationId", id),
            Effect.flatMap(() =>
              pipe(
                Effect.flatMap(HttpClientProviderService, (provider) =>
                  provider(url, { body, headers: {} }),
                ),
                Effect.flatMap(parseResponse),
              ),
            ),
          );
        };
        return { ...(client as any), [id]: fn };
      },
      {} as Client<Es>,
    );
