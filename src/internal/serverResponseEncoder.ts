import * as Body from "@effect/platform/Http/Body";
import * as Headers from "@effect/platform/Http/Headers";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import { Schema } from "@effect/schema";
import { Effect } from "effect";
import {
  EndpointSchemas,
  IgnoredSchemaId,
  ResponseSchemaFull,
} from "effect-http/Api";
import * as ServerError from "effect-http/ServerError";
import { formatParseError } from "effect-http/internal/formatParseError";
import { AnySchema, isArray } from "effect-http/internal/utils";

interface ServerResponseEncoder {
  encodeResponse: (
    input: unknown,
  ) => Effect.Effect<
    never,
    ServerError.InvalidResponseError,
    ServerResponse.ServerResponse
  >;
}

const make = (
  encodeResponse: ServerResponseEncoder["encodeResponse"],
): ServerResponseEncoder => ({ encodeResponse });

export const create = (
  responseSchema: EndpointSchemas["response"],
): ServerResponseEncoder => {
  if (Schema.isSchema(responseSchema)) {
    return fromSchema(responseSchema);
  } else if (isArray(responseSchema)) {
    return fromResponseSchemaFullArray(responseSchema);
  }

  return fromResponseSchemaFullArray([responseSchema]);
};

const fromSchema = (schema: AnySchema): ServerResponseEncoder => {
  const parse = Schema.encode(schema);
  return make((body) =>
    parse(body).pipe(
      Effect.mapError((error) => ServerError.invalidResponseError(formatParseError(error))),
      Effect.flatMap((json) =>
        ServerResponse.json(json).pipe(Effect.mapError(convertBodyError)),
      ),
    ),
  );
};

const fromResponseSchemaFullArray = (
  schemas: readonly ResponseSchemaFull[],
): ServerResponseEncoder => {
  const statusToSchema = schemas.reduce(
    (obj, schemas) => ({ ...obj, [schemas.status]: schemas }),
    {} as Record<number, ResponseSchemaFull>,
  );

  return make((input: unknown) =>
    Effect.gen(function* (_) {
      const _input = yield* _(parseFullResponseInput(input), Effect.orDie);

      const schemas = statusToSchema[_input.status];
      const setContent = createContentSetter(schemas);
      const setHeaders = createHeadersSetter(schemas);

      return yield* _(
        ServerResponse.empty({ status: _input.status }).pipe(
          setContent(_input),
          Effect.flatMap(setHeaders(_input)),
        ),
      );
    }),
  );
};

const createContentSetter = (schema: ResponseSchemaFull) => {
  const setBody =
    schema.content === IgnoredSchemaId
      ? undefined
      : ServerResponse.schemaJson(schema.content);

  return (input: FullResponseInput) =>
    (response: ServerResponse.ServerResponse) => {
      if (setBody === undefined && input.content !== undefined) {
        return Effect.die("Unexpected response content");
      } else if (setBody !== undefined && input.content === undefined) {
        return Effect.die("Response content not provided");
      } else if (setBody === undefined) {
        return Effect.succeed(response);
      }

      return setBody(input.content, response).pipe(
        Effect.mapError(convertBodyError),
      );
    };
};

const createHeadersSetter = (schema: ResponseSchemaFull) => {
  const parseHeaders =
    schema.headers === IgnoredSchemaId
      ? undefined
      : Schema.parse(schema.headers);

  return (input: FullResponseInput) =>
    (response: ServerResponse.ServerResponse) => {
      if (parseHeaders === undefined && input.headers !== undefined) {
        return Effect.die("Unexpected response headers");
      } else if (parseHeaders !== undefined && input.headers === undefined) {
        return Effect.die("Response headers not provided");
      } else if (parseHeaders === undefined) {
        return Effect.succeed(response);
      }

      return parseHeaders(input.headers).pipe(
        Effect.mapError((error) =>
          ServerError.invalidResponseError({
            error: "Invalid response headers",
            details: error,
          }),
        ),
        Effect.map((headers) =>
          response.pipe(ServerResponse.setHeaders(headers as Headers.Input)),
        ),
      );
    };
};

const FullResponseInput = Schema.struct({
  content: Schema.optional(Schema.unknown),
  headers: Schema.optional(Schema.record(Schema.string, Schema.unknown)),
  status: Schema.number,
});
type FullResponseInput = Schema.Schema.To<typeof FullResponseInput>;

const parseFullResponseInput = Schema.parse(FullResponseInput);

const convertBodyError = (error: Body.BodyError) => {
  if (error.reason._tag === "JsonError") {
    return ServerError.invalidResponseError("Invalid response JSON");
  } else if (error.reason._tag === "SchemaError") {
    return ServerError.invalidResponseError({
      error: "Invalid response",
      details: error.reason.error,
    });
  }

  throw new Error(`Handling of ${error} not implemented`);
};
