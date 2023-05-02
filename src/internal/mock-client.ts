import type { MockClientOptions } from "effect-http/MockClient";
import * as OpenApi from "schema-openapi";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

import type { AnyApi } from "../Api";
import type { Client } from "../Client";
import { createInputParser } from "./client";

export const mockClient =
  <A extends AnyApi>(option?: Partial<MockClientOptions<A>>) =>
  (api: A): Client<A> =>
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
    }, {} as Client<A>);
