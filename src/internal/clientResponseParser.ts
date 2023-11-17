import * as ClientResponse from "@effect/platform/Http/ClientResponse";
import * as Schema from "@effect/schema/Schema";
import * as Api from "effect-http/Api";
import * as ClientError from "effect-http/ClientError";
import * as utils from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import * as Unify from "effect/Unify";

interface ClientResponseParser {
  parseResponse: (
    response: ClientResponse.ClientResponse,
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
  } else if (utils.isArray(responseSchema)) {
    return fromResponseSchemaFullArray(responseSchema);
  }

  return fromResponseSchemaFullArray([responseSchema]);
};

const handleUnsucessful = Unify.unify(
  (response: ClientResponse.ClientResponse) => {
    if (response.status >= 300) {
      return response.json.pipe(
        Effect.orElse(() => response.text),
        Effect.orElseSucceed(() => "No body provided"),
        Effect.flatMap((error) =>
          Effect.fail(ClientError.makeServerSide(error, response.status)),
        ),
      );
    }

    return Effect.unit;
  },
);

const fromSchema = (schema: Schema.Schema<any>): ClientResponseParser => {
  const parse = Schema.parse(schema);
  return make((response) =>
    Effect.gen(function* (_) {
      yield* _(handleUnsucessful(response));

      const json = yield* _(
        response.json,
        Effect.mapError((error) =>
          ClientError.makeClientSide(
            error,
            `Invalid response: ${error.reason}`,
          ),
        ),
      );

      return yield* _(
        parse(json),
        Effect.mapError(ClientError.makeClientSideResponseValidation("body")),
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
              Effect.mapError((error) =>
                ClientError.makeClientSide(
                  error,
                  `Invalid response: ${error.reason}`,
                ),
              ),
              Effect.flatMap((json) =>
                Schema.parse(contextSchema)(json).pipe(
                  Effect.mapError(
                    ClientError.makeClientSideResponseValidation("body"),
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
                ClientError.makeClientSideResponseValidation("headers"),
              ),
            );

      return { status: response.status, content, headers };
    }),
  );
};
