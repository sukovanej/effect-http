import { HttpClient } from "@effect/platform";
import { Schema } from "@effect/schema";
import { Effect, Unify } from "effect";
import * as Api from "effect-http/Api";
import * as ClientError from "effect-http/ClientError";
import { formatParseError } from "effect-http/internal/formatParseError";
import { AnySchema, isArray } from "effect-http/internal/utils";

interface ClientResponseParser {
  parseResponse: (
    response: HttpClient.response.ClientResponse,
  ) => Effect.Effect<never, ClientError.ClientError, any>;
}

const make = (
  parseResponse: ClientResponseParser["parseResponse"],
): ClientResponseParser => ({ parseResponse });

export const create = (
  responseSchema: Api.EndpointSchemas["response"],
): ClientResponseParser => {
  if (Schema.isSchema(responseSchema)) {
    return fromSchema(responseSchema);
  } else if (isArray(responseSchema)) {
    return fromResponseSchemaFullArray(responseSchema);
  }

  return fromResponseSchemaFullArray([responseSchema]);
};

const handleUnsucessful = Unify.unify(
  (response: HttpClient.response.ClientResponse) => {
    if (response.status >= 300) {
      return response.json.pipe(
        Effect.orElseSucceed(() => "No body provided"),
        Effect.flatMap((error) =>
          Effect.fail(ClientError.httpClientError(error, response.status)),
        ),
      );
    }

    return Effect.unit;
  },
);

const fromSchema = (schema: AnySchema): ClientResponseParser => {
  const parse = Schema.parse(schema);
  return make((response) =>
    Effect.gen(function* (_) {
      yield* _(handleUnsucessful(response));

      const json = yield* _(
        response.json,
        Effect.mapError((error) => ClientError.unexpectedClientError(error)),
      );

      return yield* _(
        parse(json),
        Effect.mapError((error) =>
          ClientError.validationClientError(formatParseError(error)),
        ),
      );
    }),
  );
};

const fromResponseSchemaFullArray = (
  schemas: readonly Api.ResponseSchemaFull[],
): ClientResponseParser => {
  const statusToSchema = schemas.reduce(
    (obj, schemas) => ({ ...obj, [schemas.status]: schemas }),
    {} as Record<number, Api.ResponseSchemaFull>,
  );

  return make((response) =>
    Effect.gen(function* (_) {
      yield* _(handleUnsucessful(response));

      if (!(response.status in statusToSchema)) {
        const allowedStatuses = Object.keys(statusToSchema);

        return yield* _(
          Effect.dieMessage(
            `Unexpected status ${response.status}. Allowed ones are ${allowedStatuses}.`,
          ),
        );
      }

      const schemas = statusToSchema[response.status];

      const content =
        schemas.content === Api.IgnoredSchemaId
          ? undefined
          : yield* _(
              response,
              HttpClient.response.schemaBodyJson(schemas.content),
              Effect.mapError(ClientError.validationClientError),
            );

      const headers =
        schemas.headers === Api.IgnoredSchemaId
          ? undefined
          : yield* _(
              response.headers,
              Schema.parse(schemas.headers),
              Effect.mapError(ClientError.validationClientError),
            );

      return { status: response.status, content, headers };
    }),
  );
};
