import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import * as Schema from "@effect/schema/Schema";
import { Effect, Option, Unify, pipe } from "effect";
import * as Api from "effect-http/Api";
import * as ServerError from "effect-http/ServerError";
import { formatParseError } from "effect-http/internal/formatParseError";

interface ServerRequestParser {
  parseRequest: (
    input: ServerRequest.ServerRequest,
  ) => Effect.Effect<
    never,
    ServerError.ServerError,
    { query: any; params: any; body: any; headers: any }
  >;
}

const createError = (
  location: "query" | "path" | "body" | "headers",
  message: string,
) =>
  ServerError.makeJson(400, {
    error: "Request validation error",
    location,
    message,
  });

const make = (
  parseRequest: ServerRequestParser["parseRequest"],
): ServerRequestParser => ({ parseRequest });

export const create = (endpoint: Api.Endpoint): ServerRequestParser => {
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

const createBodyParser = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.body;

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);

  return Unify.unify((request: ServerRequest.ServerRequest) => {
    if (schema === Api.FormData) {
      // TODO
      return Effect.succeed(undefined);
    }

    return request.json.pipe(
      Effect.mapError((error) => {
        if (error.reason === "Transport") {
          return createError("body", "Unexpect request JSON body error");
        }

        return createError("body", "Invalid JSON");
      }),
      Effect.flatMap((request) =>
        parse(request).pipe(
          Effect.mapError((error) =>
            createError("body", formatParseError(error)),
          ),
        ),
      ),
    );
  });
};

const createQueryParser = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.query;

  if (schema == Api.IgnoredSchemaId) {
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
      Effect.mapError((error) => createError("query", formatParseError(error))),
    );
  };
};

const createHeadersParser = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.headers;

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);

  return (request: ServerRequest.ServerRequest) =>
    parse(request.headers).pipe(
      Effect.mapError((error) =>
        createError("headers", formatParseError(error)),
      ),
    );
};

const createParamsParser = (endpoint: Api.Endpoint) => {
  const schema = endpoint.schemas.request.params;

  if (schema == Api.IgnoredSchemaId) {
    return () => Effect.succeed(undefined);
  }

  const parse = Schema.parse(schema);
  const getRequestParams = createParamsMatcher(endpoint.path);

  return (request: ServerRequest.ServerRequest) => {
    // TODO
    const url = new URL(request.url, "http://localhost");
    const params = getRequestParams(url);
    return parse(params).pipe(
      Effect.mapError((error) => createError("path", formatParseError(error))),
    );
  };
};

export const createParamsMatcher = (path: string) => {
  // based on https://github.com/kwhitley/itty-router/blob/73148972bf2e205a4969e85672e1c0bfbf249c27/src/itty-router.js
  const matcher = RegExp(
    `^${path
      .replace(/(\/?)\*/g, "($1.*)?")
      .replace(/\/$/, "")
      .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3")
      .replace(/\.(?=[\w(])/, "\\.")
      .replace(/\)\.\?\(([^[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.")}/*$`,
  );
  return (url: URL): Record<string, string> => {
    const match = url.pathname.match(matcher);
    return pipe(
      Option.fromNullable(match),
      Option.flatMap(({ groups }) => Option.fromNullable(groups)),
      Option.map((groups) =>
        Object.entries(groups).filter(([_, value]) => value !== undefined),
      ),
      Option.map(Object.fromEntries),
      Option.getOrElse(() => ({})),
    );
  };
};
