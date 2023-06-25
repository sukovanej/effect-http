import * as OpenApi from "schema-openapi";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import { type Api, IgnoredSchemaId } from "effect-http/Api";
import type { Client, ClientOptions } from "effect-http/Client";
import type { MockClientOptions } from "effect-http/MockClient";
import { createInputParser } from "effect-http/internal/client";

import { isArray } from "./utils";

export const mockClient =
  <A extends Api, H extends Record<string, unknown>>(
    option?: Partial<MockClientOptions<A> & ClientOptions<H>>,
  ) =>
  (api: A): Client<A, H> =>
    api.endpoints.reduce(
      (client, { id, schemas }) => {
        const parseInputs = createInputParser(schemas);

        const customResponses = option?.responses;
        const customResponse =
          customResponses &&
          customResponses[id as A["endpoints"][number]["id"]];

        const fn = (args: any) => {
          const getSchema = () => {
            if (isArray(schemas.response)) {
              return Schema.union(
                ...schemas.response.map(({ status, content, headers }) =>
                  Schema.struct({
                    status: Schema.literal(status),
                    content:
                      content === IgnoredSchemaId ? Schema.undefined : content,
                    headers:
                      headers === IgnoredSchemaId
                        ? Schema.undefined
                        : Schema.struct(headers),
                  }),
                ),
              );
            }

            return schemas.response;
          };

          const responseSchema = getSchema();

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
