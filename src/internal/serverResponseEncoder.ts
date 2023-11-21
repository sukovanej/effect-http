import * as Body from "@effect/platform/Http/Body";
import * as Headers from "@effect/platform/Http/Headers";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import * as Schema from "@effect/schema/Schema";
import { ReadonlyArray } from "effect";
import * as Api from "effect-http/Api";
import * as HttpSchema from "effect-http/HttpSchema";
import * as Representation from "effect-http/Representation";
import * as ServerError from "effect-http/ServerError";
import { formatParseError } from "effect-http/internal/formatParseError";
import * as utils from "effect-http/internal/utils";
import * as Effect from "effect/Effect";
import { flow, pipe } from "effect/Function";
import * as Option from "effect/Option";

interface ServerResponseEncoder {
  encodeResponse: (
    input: unknown,
  ) => Effect.Effect<
    never,
    ServerError.ServerError,
    ServerResponse.ServerResponse
  >;
}

const createErrorResponse = (error: string, message: string) =>
  ServerError.makeJson(500, { error, message });

const make = (
  encodeResponse: ServerResponseEncoder["encodeResponse"],
): ServerResponseEncoder => ({ encodeResponse });

export const create = (
  responseSchema: Api.EndpointSchemas["response"],
): ServerResponseEncoder => {
  if (Schema.isSchema(responseSchema)) {
    return fromSchema(responseSchema);
  } else if (utils.isArray(responseSchema)) {
    return fromResponseSchemaFullArray(responseSchema);
  }

  return fromResponseSchemaFullArray([responseSchema]);
};

const createRepresentationPicker = (
  representations: ReadonlyArray.NonEmptyReadonlyArray<
    Representation.Representation<any>
  >,
): ((
  response: ServerResponse.ServerResponse,
) => Representation.Representation<any>) => {
  if (representations.length === 0) {
    return () => representations[0];
  }

  return (response) => {
    const accept = response.headers["accept"];

    // TODO: this logic needs to be improved a lot!
    return pipe(
      representations,
      ReadonlyArray.filter(
        (representation) => representation.contentType === accept,
      ),
      ReadonlyArray.head,
      Option.getOrElse(() => representations[0]),
    );
  };
};

const encodeContent = (schema: Schema.Schema<any>) => {
  const encodeContent = Schema.encode(schema);
  const { encode } = pipe(
    HttpSchema.getContentCodecAnnotation(schema),
    Option.getOrElse(() => HttpSchema.jsonContentCodec),
  );
  const contentType = createContentType(schema);

  return (content: unknown) => (response: ServerResponse.ServerResponse) =>
    pipe(
      encodeContent(content),
      Effect.mapError((error) =>
        createErrorResponse(
          "Invalid response content",
          formatParseError(error),
        ),
      ),
      Effect.flatMap(
        flow(
          encode,
          Effect.mapError((error) =>
            createErrorResponse("Invalid response content", error.message),
          ),
        ),
      ),
      Effect.map((content) =>
        response.pipe(ServerResponse.setBody(Body.text(content, contentType))),
      ),
    );
};

const fromSchema = (schema: Schema.Schema<any>): ServerResponseEncoder => {
  const encode = encodeContent(schema);

  return make((input) =>
    ServerResponse.empty({ status: 200 }).pipe(encode(input)),
  );
};

const fromResponseSchemaFullArray = (
  schemas: readonly Api.ResponseSchemaFull[],
): ServerResponseEncoder => {
  const statusToSchema = schemas.reduce(
    (obj, schemas) => ({ ...obj, [schemas.status]: schemas }),
    {} as Record<number, Api.ResponseSchemaFull>,
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

const createContentType = (schema: Schema.Schema<any> | undefined) =>
  pipe(
    Option.fromNullable(schema),
    Option.flatMap(HttpSchema.getContentTypeAnnotation),
    Option.getOrElse(() => "application/json"),
  );

const createContentSetter = (schema: Api.ResponseSchemaFull) => {
  const contentSchema =
    schema.content === Api.IgnoredSchemaId ? undefined : schema.content;
  const encode = contentSchema && encodeContent(contentSchema);

  return (input: FullResponseInput) =>
    (response: ServerResponse.ServerResponse) => {
      if (encode === undefined && input.content !== undefined) {
        return Effect.die("Unexpected response content");
      } else if (encode !== undefined && input.content === undefined) {
        return Effect.die("Response content not provided");
      } else if (encode === undefined) {
        return Effect.succeed(response);
      }

      return pipe(response, encode(input.content));
    };
};

const createHeadersSetter = (schema: Api.ResponseSchemaFull) => {
  const parseHeaders =
    schema.headers === Api.IgnoredSchemaId
      ? undefined
      : Schema.encode(schema.headers);

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
        Effect.map((headers) =>
          response.pipe(ServerResponse.setHeaders(headers as Headers.Input)),
        ),
        Effect.mapError((error) =>
          createErrorResponse(
            "Invalid response headers",
            formatParseError(error),
          ),
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
