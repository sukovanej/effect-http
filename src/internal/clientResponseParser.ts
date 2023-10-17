import { HttpClient } from "@effect/platform";
import { Schema } from "@effect/schema";
import { Effect, Unify } from "effect";
import * as Api from "effect-http/Api";
import * as ClientError from "effect-http/ClientError";
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
          Effect.fail(
            ClientError.HttpClientError.create(error, response.status),
          ),
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
        Effect.mapError(ClientError.ResponseError.fromResponseError),
      );

      return yield* _(
        parse(json),
        Effect.mapError(
          ClientError.ResponseValidationError.fromParseError("body"),
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

      const contextSchema = schemas.content;

      const content =
        contextSchema === Api.IgnoredSchemaId
          ? undefined
          : yield* _(
              response.json,
              Effect.mapError(ClientError.ResponseError.fromResponseError),
              Effect.flatMap((json) =>
                Schema.parse(contextSchema)(json).pipe(
                  Effect.mapError(
                    ClientError.ResponseValidationError.fromParseError("body"),
                  ),
                ),
              ),
            );

      const headers =
        schemas.headers === Api.IgnoredSchemaId
          ? undefined
          : yield* _(
              response.headers,
              Schema.parse(schemas.headers),
              Effect.mapError(
                ClientError.ResponseValidationError.fromParseError("headers"),
              ),
            );

      return { status: response.status, content, headers };
    }),
  );
};
