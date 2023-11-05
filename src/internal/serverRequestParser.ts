import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import * as Schema from "@effect/schema/Schema";
import { Effect } from "effect";
import { Endpoint, IgnoredSchemaId } from "effect-http/Api";
import { createParamsMatcher } from "effect-http/Server";
import * as ServerError from "effect-http/ServerError";
import { formatParseError } from "effect-http/internal/formatParseError";

interface ServerRequestParser {
  parseRequest: (
    input: ServerRequest.ServerRequest,
  ) => Effect.Effect<
    never,
    ServerError.ApiClientError,
    { query: any; params: any; body: any; headers: any }
  >;
}

const make = (
  parseRequest: ServerRequestParser["parseRequest"],
): ServerRequestParser => ({ parseRequest });

export const create = (endpoint: Endpoint): ServerRequestParser => {
  const parseBody = createBodyParser(endpoint);
  const parseQuery = createQueryParser(endpoint);
  const parseHeaders = createHeadersParser(endpoint);
  const parseParams = createParamsParser(endpoint);

  return make((request) =>
    Effect.all({
      body: parseBody(request),
      query: parseQuery(request),
      params: parseParams(request),
      headers: parseHeaders(request),
    }),
  );
};

const createBodyParser = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.body;

  if (schema == IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);

  return (request: ServerRequest.ServerRequest) =>
    request.json.pipe(
      Effect.mapError((error) => {
        if (error.reason === "Transport") {
          return ServerError.invalidBodyError("Unexpect request JSON body error");
        }

        return ServerError.invalidBodyError("invalid JSON");
      }),
      Effect.flatMap((request) =>
        parse(request).pipe(
          Effect.mapError((error) => ServerError.invalidBodyError(formatParseError(error))),
        ),
      ),
    );
};

const createQueryParser = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.query;

  if (schema == IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);

  return (request: ServerRequest.ServerRequest) => {
    // TODO
    const url = new URL(request.url, "http://localhost");
    return parse(
      Array.from(url.searchParams.entries()).reduce(
        (acc, [name, value]) => ({ ...acc, [name]: value }),
        {},
      ),
    ).pipe(
      Effect.mapError((error) => ServerError.invalidQueryError(formatParseError(error))),
    );
  };
};

const createHeadersParser = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.headers;

  if (schema == IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);

  return (request: ServerRequest.ServerRequest) =>
    parse(request.headers).pipe(
      Effect.mapError((error) => ServerError.invalidHeadersError(formatParseError(error))),
    );
};

const createParamsParser = (endpoint: Endpoint) => {
  const schema = endpoint.schemas.request.params;

  if (schema == IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);
  const getRequestParams = createParamsMatcher(endpoint.path);

  return (request: ServerRequest.ServerRequest) => {
    // TODO
    const url = new URL(request.url, "http://localhost");
    const params = getRequestParams(url);
    return parse(params).pipe(
      Effect.mapError((error) => ServerError.invalidParamsError(formatParseError(error))),
    );
  };
};
