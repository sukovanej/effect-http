import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import { Api, Endpoint } from "./api";
import { EndpointSchemasToInput } from "./internal";

type Client<Es extends Endpoint[]> = S.Spread<{
  [Id in Es[number]["id"]]: (
    input: EndpointSchemasToInput<Extract<Es[number], { id: Id }>["schemas"]>,
  ) => Effect.Effect<
    never,
    never,
    Extract<Es[number], { id: Id }>["schemas"]["response"]
  >;
}>;

export const client =
  (baseUrl: URL) =>
  <Es extends Endpoint[]>(api: Api<Es>): Client<Es> =>
    api.reduce(
      (client, { id, method, path, schemas: { query, params, body } }) => {
        const fn = (args: any) => {
          const url = new URL(baseUrl);

          if (query !== S.unknown) {
            const query = new URLSearchParams(args["query"]);

            for (const [k, v] of query.entries()) {
              url.searchParams.set(k, v);
            }
          }

          if (params !== S.unknown) {
            // TODO: set params
            args["params"];
          }

          let requestBody = undefined;

          if (body !== S.unknown) {
            requestBody = args["body"];
          }

          return pipe(
            Effect.logInfo(
              `${method} ${baseUrl}/${path} with ${JSON.stringify(body)}`,
            ),
            Effect.logAnnotate("clientOperationId", id),
          );
        };
        return { ...(client as any), [id]: fn };
      },
      {} as Client<Es>,
    );
