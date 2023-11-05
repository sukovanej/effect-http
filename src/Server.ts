/**
 * Combinators and constructors for server-side implemnetation.
 *
 * @since 1.0.0
 */
import { ParseResult, Schema } from "@effect/schema";
import { Effect, Either, Option, Predicate, pipe } from "effect";
import { Api, Endpoint, EndpointSchemas } from "effect-http/Api";
import type {
  AfterHandlerExtension,
  BeforeHandlerExtension,
  OnErrorExtension,
} from "effect-http/Extensions";
import type {
  ServerBuilder,
  ServerBuilderHandler,
  ServerExtension,
} from "effect-http/ServerBuilder";
import * as ServerError from "effect-http/ServerError";
import { responseUtil } from "effect-http/Utils";
import {
  formatValidationError,
  isParseError,
} from "effect-http/ValidationErrorFormatter";
import { getSchema, isArray } from "effect-http/internal/utils";

/** @ignore */
export interface ServerHandler<R = any> {
  fn: (request: Request) => Effect.Effect<R, ServerError.ApiError, Response>;
  endpoint: Endpoint;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Server<R, A extends Api = Api> {
  api: A;
  handlers: readonly ServerHandler<R>[];
  extensions: readonly ServerExtension<R, A["endpoints"]>[];
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const buildServer = <R, A extends Api>(
  serverBuilder: ServerBuilder<R, [], A>,
): Server<R, A> => {
  if (serverBuilder.unimplementedEndpoints.length !== 0) {
    new Error(`All endpoint must be implemented`);
  }

  return {
    api: serverBuilder.api,
    handlers: serverBuilder.handlers.map(buildHandler(serverBuilder)),
    extensions: serverBuilder.extensions,
  };
};

// internal

/** @internal */
const buildHandler =
  (serverBuilder: ServerBuilder<any>) =>
  (handler: ServerBuilderHandler<any>): ServerHandler => {
    const { schemas, path } = handler.endpoint;

    const parseQuery = Schema.parse(getSchema(schemas.request.query));
    const parseParams = Schema.parse(getSchema(schemas.request.params));
    const parseHeaders = Schema.parse(getSchema(schemas.request.headers));
    const parseBody = Schema.parse(getSchema(schemas.request.body));
    const encodeResponse = createResponseEncoder(schemas.response);

    const getRequestParams = createParamsMatcher(path);

    const _responseUtil = responseUtil(serverBuilder.api, handler.endpoint.id);

    const enhancedFn: ServerHandler["fn"] = (request) => {
      const url = new URL(request.url);
      const query = Array.from(url.searchParams.entries()).reduce(
        (acc, [name, value]) => ({ ...acc, [name]: value }),
        {},
      );
      const headers = Array.from(request.headers.entries()).reduce(
        (acc, [name, value]) => ({ ...acc, [name]: value }),
        {},
      );

      const contentLengthHeader = request.headers.get("content-length");
      const contentTypeHeader = request.headers.get("content-type");
      const contentLength =
        contentLengthHeader === null ? null : parseInt(contentLengthHeader);

      return pipe(
        Effect.tryPromise({
          try: () => {
            if (contentLength == null || contentLength > 0) {
              if (contentTypeHeader?.startsWith("application/json")) {
                return request.json();
              } else if (contentTypeHeader?.startsWith("multipart/form-data")) {
                return request.formData();
              } else {
                return request.text();
              }
            }
            return Promise.resolve(undefined);
          },
          catch: (err) =>
            ServerError.internalServerError(
              `Cannot get request JSON, ${err}, ${request.body}`,
            ),
        }),
        Effect.flatMap((body) =>
          Effect.all({
            query: Effect.mapError(
              parseQuery(query),
              ServerError.invalidQueryError,
            ),
            params: Effect.mapError(
              parseParams(getRequestParams(url)),
              ServerError.invalidParamsError,
            ),
            body: Effect.mapError(
              parseBody(body),
              ServerError.invalidBodyError,
            ),
            headers: Effect.mapError(
              parseHeaders(headers),
              ServerError.invalidHeadersError,
            ),
            ResponseUtil: Effect.succeed(_responseUtil),
          }),
        ),
        Effect.flatMap(handler.fn),
        Effect.flatMap((response) =>
          pipe(
            encodeResponse(response),
            Effect.map(
              ({ content, status, headers }) =>
                new Response(JSON.stringify(content), {
                  status,
                  ...(headers && { headers }),
                }),
            ),
            Effect.mapError(ServerError.invalidResponseError),
          ),
        ),
      );
    };

    return {
      endpoint: handler.endpoint,
      fn: runHandlerFnWithExtensions(
        serverBuilder.extensions,
        handler.endpoint,
        enhancedFn,
      ),
    };
  };

/** @internal */
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

/** @internal */
const formatError = (error: unknown) => {
  const isValidationError =
    ServerError.isInvalidQueryError(error) ||
    ServerError.isInvalidBodyError(error) ||
    ServerError.isInvalidResponseError(error) ||
    ServerError.isInvalidParamsError(error) ||
    ServerError.isInvalidHeadersError(error) ||
    ServerError.isConflictError(error);

  if (isValidationError) {
    const innerError = error.error;

    if (isParseError(innerError)) {
      return formatValidationError(innerError);
    } else if (Predicate.isString(innerError)) {
      return Effect.succeed(innerError);
    }
  }

  if (Predicate.isRecord(error) && "error" in error) {
    if (Predicate.isString(error["error"])) {
      return Effect.succeed(error["error"]);
    }

    return Effect.succeed(JSON.stringify(error["error"]));
  }

  return Effect.succeed(JSON.stringify(error));
};

/** @internal */
export const convertErrorToResponse = (error: unknown) =>
  Effect.map(formatError(error), (details) => {
    const tag = ServerError.isApiError(error)
      ? error._tag
      : "InternalServerError";
    const body = JSON.stringify({ error: tag, details });

    return new Response(body, {
      status: Object.keys(ServerError.API_STATUS_CODES).includes(tag)
        ? ServerError.API_STATUS_CODES[
            tag as keyof typeof ServerError.API_STATUS_CODES
          ]
        : 500,
      headers: new Headers({ "Content-Type": "application/json" }),
    });
  });

/** @internal */
const runHandlerFnWithExtensions = (
  allExtensions: ServerExtension<any, Endpoint[]>[],
  endpoint: Endpoint,
  fn: ServerHandler["fn"],
) => {
  const extensions = allExtensions
    .filter(
      ({ options }) =>
        options.allowOperations.includes(endpoint.id) ||
        !options.skipOperations.includes(endpoint.id),
    )
    .map(({ extension }) => extension);

  const beforeExtensions = extensions.filter(
    (h): h is BeforeHandlerExtension<any> =>
      h._tag === "BeforeHandlerExtension",
  );
  const afterExtensions = extensions.filter(
    (h): h is AfterHandlerExtension<any> => h._tag === "AfterHandlerExtension",
  );
  const onErrorExtensions = extensions.filter(
    (h): h is OnErrorExtension<any> => h._tag === "OnErrorExtension",
  );

  return (request: Request) =>
    pipe(
      Effect.all(beforeExtensions.map(({ fn }) => fn(request))),
      Effect.either,
      Effect.flatMap(
        Either.match({
          onLeft: (error) => convertErrorToResponse(error),
          onRight: () =>
            pipe(
              fn(request),
              Effect.tapError((error) =>
                Effect.all(
                  onErrorExtensions.map(({ fn }) => fn(request, error)),
                ),
              ),
              Effect.tap((response) =>
                Effect.all(
                  afterExtensions.map(({ fn }) => fn(request, response)),
                ),
              ),
              Effect.catchAll((error) => convertErrorToResponse(error)),
            ),
        }),
      ),
    );
};

/** @internal */
const createResponseEncoder = (
  responseSchema: EndpointSchemas["response"],
): ((
  a: unknown,
) => Effect.Effect<
  never,
  ParseResult.ParseError,
  { status: number; headers: Headers | undefined; content: unknown }
>) => {
  if (Schema.isSchema(responseSchema)) {
    const encodeContent = Schema.encode(responseSchema);

    return (a: unknown) =>
      pipe(
        encodeContent(a),
        Effect.map((content) => ({
          content,
          headers: new Headers({ "content-type": "application/json" }),
          status: 200,
        })),
      );
  }

  const schema = Schema.union(
    ...(isArray(responseSchema) ? responseSchema : [responseSchema]).map(
      ({ status, content, headers }) =>
        Schema.struct({
          status: Schema.literal(status),
          content: getSchema(content, Schema.optional(Schema.undefined)),
          headers: getSchema(headers, Schema.optional(Schema.undefined)),
        }),
    ),
  );

  const encode = Schema.encode(schema);

  return (a: any) =>
    Effect.map(encode(a), ({ headers, content, status }) => {
      const _headers = new Headers(headers);

      if (content !== undefined) {
        _headers.set("content-type", "application/json");
      }

      return { content, status, headers: _headers };
    });
};
