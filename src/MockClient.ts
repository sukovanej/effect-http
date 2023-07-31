/**
 * `Client` implementation derivation for testing purposes.
 *
 * @since 1.0.0
 */
import * as OpenApi from "schema-openapi";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { type Api } from "effect-http/Api";
import type {
  Client,
  ClientFunctionResponse,
  ClientOptions,
} from "effect-http/Client";
import { createRequestEncoder } from "effect-http/internal";
import { createResponseSchema } from "effect-http/internal";

/**
 * @category models
 * @since 1.0.0
 */
export type MockClientOptions<A extends Api> = {
  responses: {
    [Id in A["endpoints"][number]["id"]]: ClientFunctionResponse<
      Extract<A["endpoints"][number], { id: Id }>["schemas"]["response"]
    >;
  };
};

/**
 * Derive mock client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const mockClient =
  <A extends Api, H extends Record<string, unknown>>(
    option?: Partial<MockClientOptions<A> & ClientOptions<H>>,
  ) =>
  (api: A): Client<A, H> =>
    api.endpoints.reduce(
      (client, { id, schemas }) => {
        const parseInputs = createRequestEncoder(schemas.request);
        const responseSchema = createResponseSchema(schemas.response);

        const customResponses = option?.responses;
        const customResponse =
          customResponses &&
          customResponses[id as A["endpoints"][number]["id"]];

        const fn = (args: any) => {
          return pipe(
            parseInputs(args),
            Effect.flatMap(() =>
              customResponse !== undefined
                ? Effect.succeed(customResponse)
                : OpenApi.randomExample(responseSchema),
            ),
          );
        };

        return { ...client, [id]: fn };
      },
      {} as Client<A, H>,
    );
