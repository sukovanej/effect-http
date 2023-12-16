import * as OpenApi from "schema-openapi";

import type * as Api from "effect-http/Api";
import type * as Client from "effect-http/Client";
import type * as MockClient from "effect-http/MockClient";
import * as ClientRequestEncoder from "effect-http/internal/clientRequestEncoder";
import * as utils from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

export const make = <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  option?: Partial<MockClient.Options<Endpoints>>,
): Client.Client<Endpoints> =>
  api.endpoints.reduce((client, endpoint) => {
    const requestEncoder = ClientRequestEncoder.create(endpoint);
    const responseSchema = utils.createResponseSchema(
      endpoint.schemas.response,
    );

    const customResponses = option?.responses;
    const customResponse =
      customResponses && customResponses[endpoint.id as Endpoints["id"]];

    const fn = (args: unknown) => {
      return pipe(
        requestEncoder.encodeRequest(args),
        Effect.flatMap(() =>
          customResponse !== undefined
            ? Effect.succeed(customResponse)
            : OpenApi.randomExample(responseSchema),
        ),
      );
    };

    return { ...client, [endpoint.id]: fn };
  }, {} as Client.Client<Endpoints>);
