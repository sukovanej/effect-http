/**
 * `Client` implementation derivation for testing purposes.
 *
 * @since 1.0.0
 */
import * as OpenApi from "schema-openapi";

import type * as Api from "effect-http/Api";
import type * as Client from "effect-http/Client";
import * as utils from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

/**
 * @category models
 * @since 1.0.0
 */
export type MockClientOptions<Endpoints extends Api.Endpoint> = {
  responses: {
    [Id in Endpoints["id"]]: Client.ClientFunctionResponse<
      Extract<Endpoints, { id: Id }>["schemas"]["response"]
    >;
  };
};

/**
 * Derive mock client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make = <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  option?: Partial<MockClientOptions<Endpoints>>,
): Client.Client<Endpoints> =>
  api.endpoints.reduce((client, { id, schemas }) => {
    const parseInputs = utils.createRequestEncoder(schemas.request);
    const responseSchema = utils.createResponseSchema(schemas.response);

    const customResponses = option?.responses;
    const customResponse =
      customResponses && customResponses[id as Endpoints["id"]];

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
  }, {} as Client.Client<Endpoints>);
