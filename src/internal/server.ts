import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import type { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import {
  type Api,
  type Endpoint,
  EndpointSchemas,
  IgnoredSchemaId,
} from "effect-http/Api";
import {
  Extension,
  accessLogExtension,
  errorLogExtension,
} from "effect-http/Extensions";
import type {
  AddServerHandle,
  ApiToServer,
  Handler,
  InputHandlerFn,
  SelectEndpointById,
  Server,
  ServerExtension,
  ServerExtensionOptions,
  ServerUnimplementedIds,
} from "effect-http/Server";
import {
  internalServerError,
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
  invalidResponseError,
} from "effect-http/ServerError";
import {
  getSchema,
  getStructSchema,
  isArray,
} from "effect-http/internal/utils";

/** @internal */
export const server = <A extends Api>(api: A): ApiToServer<A> =>
  ({
    unimplementedEndpoints: api.endpoints,
    api,

    handlers: [],
    extensions: defaultExtensions,
  }) as unknown as ApiToServer<A>;

const createParamsMatcher = (path: string) => {
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
    return (match && match.groups) || {};
  };
};

const createResponseEncoder = (
  responseSchema: EndpointSchemas["response"],
): ((
  a: unknown,
) => Effect.Effect<
  never,
  ParseError,
  { status: number; headers: Headers | undefined; content: unknown }
>) => {
  if (isArray(responseSchema)) {
    const schema = Schema.union(
      ...responseSchema.map((s) =>
        Schema.struct({
          status: Schema.literal(s.status),
          content:
            s.content === IgnoredSchemaId
              ? Schema.optional(Schema.undefined)
              : (s.content as Schema.Schema<any>),
          headers:
            s.headers === IgnoredSchemaId
              ? Schema.optional(Schema.undefined)
              : Schema.struct(s.headers),
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
  }

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
};

/** @internal */
const enhanceHandler = (
  fn: InputHandlerFn<Endpoint, any>,
  endpoint: Endpoint,
): Handler => {
  const { schemas, path } = endpoint;

  const parseQuery = Schema.parse(getStructSchema(schemas.query));
  const parseParams = Schema.parse(getStructSchema(schemas.params));
  const parseHeaders = Schema.parse(getStructSchema(schemas.headers));
  const parseBody = Schema.parse(getSchema(schemas.body));
  const encodeResponse = createResponseEncoder(schemas.response);

  const getRequestParams = createParamsMatcher(path);

  const enhancedFn: Handler["fn"] = (request) => {
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
      contentLengthHeader === null ? 0 : parseInt(contentLengthHeader);

    return pipe(
      Effect.tryPromise({
        try: () => {
          if (contentLength > 0) {
            if (contentTypeHeader?.startsWith("application/json")) {
              return request.json();
            } else {
              return request.text();
            }
          }
          return Promise.resolve(undefined);
        },
        catch: (err) =>
          internalServerError(
            `Cannot get request JSON, ${err}, ${request.body}`,
          ),
      }),
      Effect.flatMap((body) =>
        Effect.all({
          query: Effect.mapError(parseQuery(query), invalidQueryError),
          params: Effect.mapError(
            parseParams(getRequestParams(url)),
            invalidParamsError,
          ),
          body: Effect.mapError(parseBody(body), invalidBodyError),
          headers: Effect.mapError(parseHeaders(headers), invalidHeadersError),
        }),
      ),
      Effect.flatMap(fn),
      Effect.flatMap((response) => {
        if (response instanceof Response) {
          return Effect.succeed(response);
        }

        return pipe(
          encodeResponse(response),
          Effect.map(
            ({ content, status, headers }) =>
              new Response(JSON.stringify(content), { status, headers }),
          ),
          Effect.mapError(invalidResponseError),
        );
      }),
    );
  };

  return { endpoint, fn: enhancedFn };
};

/** @internal */
export const handle =
  <S extends Server<any>, Id extends ServerUnimplementedIds<S>, R>(
    id: Id,
    fn: InputHandlerFn<SelectEndpointById<S["unimplementedEndpoints"], Id>, R>,
  ) =>
  (api: S): AddServerHandle<S, Id, R> => {
    const endpoint = api.unimplementedEndpoints.find(
      ({ id: _id }) => _id === id,
    );

    if (endpoint === undefined) {
      throw new Error(`Operation id ${id} not found`);
    }

    const newUnimplementedEndpoints = api.unimplementedEndpoints.filter(
      ({ id: _id }) => _id !== id,
    );

    const handler = enhanceHandler(fn, endpoint);

    return {
      ...api,
      unimplementedEndpoints: newUnimplementedEndpoints,
      handlers: [...api.handlers, handler],
    } as unknown as AddServerHandle<S, Id, R>;
  };

/** @internal */
export const createServerExtention = <R, Es extends Endpoint[]>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<Es>>,
): ServerExtension<R, Es> => ({
  extension,
  options: {
    skipOperations: options?.skipOperations ?? [],
    allowOperations: options?.allowOperations ?? [],
  },
});

/** @internal */
const defaultExtensions = [
  createServerExtention(accessLogExtension()),
  createServerExtention(errorLogExtension()),
];
