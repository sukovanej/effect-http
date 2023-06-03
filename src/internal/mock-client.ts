import * as OpenApi from "schema-openapi";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

import type { AnyApi } from "effect-http/Api";
import type { Client, ClientOptions } from "effect-http/Client";
import type { MockClientOptions } from "effect-http/MockClient";
import { createInputParser } from "effect-http/internal/client";

export const mockClient =
  <A extends AnyApi, H extends Record<string, unknown>>(
    option?: Partial<MockClientOptions<A> & ClientOptions<H>>,
  ) =>
  (api: A): Client<A, H> =>
    api.endpoints.reduce((client, { id, schemas }) => {
      const parseInputs = createInputParser(schemas);

      const customResponses = option?.responses;
      const customResponse =
        customResponses && customResponses[id as A["endpoints"][number]["id"]];

      const fn = (args: any) => {
        return pipe(
          parseInputs(args),
          Effect.flatMap(() =>
            customResponse !== undefined
              ? Effect.succeed(customResponse)
              : OpenApi.randomExample(schemas.response),
          ),
        );
      };

      return { ...client, [id]: fn };
    }, {} as Client<A, H>);
