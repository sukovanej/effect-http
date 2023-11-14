import { HttpClient } from "@effect/platform";
import { Schema } from "@effect/schema";
import { Effect, Predicate, identity, pipe } from "effect";
import { Endpoint, IgnoredSchemaId } from "effect-http/Api";
import * as ClientError from "effect-http/ClientError";
import { convertMethod } from "effect-http/internal/utils";

interface ClientRequestEncoder {
  encodeRequest: (
    input: unknown,
  ) => Effect.Effect<
    never,
    ClientError.ClientError,
    HttpClient.request.ClientRequest
  >;
}

const make = (
  encodeRequest: ClientRequestEncoder["encodeRequest"],
): ClientRequestEncoder => ({ encodeRequest });

export const create = (
  endpoint: Endpoint,
): ClientRequestEncoder => {
  const encodeBody = createBodyEncoder(endpoint);
  const encodeQuery = createQueryEncoder(endpoint);
  const encodeHeaders = createHeadersEncoder(endpoint);
  const encodeParams = createParamsEncoder(endpoint);

  return make((input) =>
    Effect.gen(function* (_) {
      const _input = (input || {}) as Record<string, unknown>;

      const body = yield* _(encodeBody(_input["body"]));
      const query = yield* _(encodeQuery(_input["query"]));
      const params = yield* _(encodeParams(_input["params"]));
      const headers = yield* _(encodeHeaders(_input["headers"]));

      const path = constructPath(params || {}, endpoint.path);

      const request = pipe(
        HttpClient.request.get(path),
        HttpClient.request.setMethod(convertMethod(endpoint.method)),
        body === undefined
          ? identity
          : body instanceof FormData
          ? HttpClient.request.formDataBody(body)
          : HttpClient.request.unsafeJsonBody(body),
        query ? HttpClient.request.setUrlParams(query) : identity,
        headers ? HttpClient.request.setHeaders(headers) : identity,
      );

      return request;
    }),
  );
};

const ignoredSchemaEncoder = (name: string) => (input: unknown) => {
  if (input !== undefined) {
    return Effect.dieMessage(
      `Unexpected ${name} provided, got ${JSON.stringify(input)}`,
    );
  }

  return Effect.succeed(undefined);
};

const createBodyEncoder = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.body;

  if (schema == IgnoredSchemaId) {
    return ignoredSchemaEncoder("body");
  }

  const encode = Schema.encode(schema);

  return (body: unknown) => {
    return encode(body).pipe(
      Effect.mapError(ClientError.RequestEncodeError.fromParseError("body")),
    );
  };
};

const isRecordOrUndefined = (
  i: unknown,
): i is Record<string | symbol, unknown> | undefined =>
  Predicate.isRecord(i) || Predicate.isUndefined(i);

const createQueryEncoder = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.query;

  if (schema == IgnoredSchemaId) {
    return ignoredSchemaEncoder("query");
  }

  const encode = Schema.encode(schema);

  return (query: unknown) => {
    return encode(query).pipe(
      Effect.mapError(ClientError.RequestEncodeError.fromParseError("query")),
    );
  };
};

const createHeadersEncoder = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.headers;

  const encode = schema == IgnoredSchemaId ? undefined : Schema.encode(schema);

  return (headers: unknown) => {
    if (!isRecordOrUndefined(headers)) {
      return Effect.dieMessage("Headers must be a record");
    }

    return (encode ?? Effect.succeed)(headers).pipe(
      Effect.mapError(ClientError.RequestEncodeError.fromParseError("headers")),
    );
  };
};

const createParamsEncoder = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.params;

  if (schema == IgnoredSchemaId) {
    return ignoredSchemaEncoder("params");
  }

  const encode = Schema.encode(schema);

  return (params: unknown) => {
    return encode(params).pipe(
      Effect.mapError(ClientError.RequestEncodeError.fromParseError("params")),
    );
  };
};

const constructPath = (
  params: Record<string, string> | undefined,
  path: string,
) => {
  return Object.entries(params ?? {})
    .reduce(
      (path, [key, value]) =>
        path.replace(new RegExp(`(:${key})(\\?)?`), value),
      path,
    )
    .replace(/\/:(\w+)(\?)?/, "");
};
