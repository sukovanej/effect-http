import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint } from "effect-http/Api";
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
import { getSchema, getStructSchema } from "effect-http/internal/utils";

/** @internal */
export const server = <A extends Api>(api: A): ApiToServer<A> =>
  ({
    _unimplementedEndpoints: api.endpoints,
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
    const match = url.pathname.match(matcher as RegExp);
    return (match && match.groups) || {};
  };
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
  const encodeResponse = Schema.encode(schemas.response);

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
        const status =
          response instanceof Response ? response.status : undefined;
        const headers =
          response instanceof Response
            ? response.headers
            : new Headers({ "content-type": "application/json" });

        return pipe(
          Effect.promise(() =>
            response instanceof Response
              ? response.json()
              : Promise.resolve(response),
          ),
          Effect.flatMap((body) => encodeResponse(body)),
          Effect.map(
            (body) => new Response(JSON.stringify(body), { status, headers }),
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
    fn: InputHandlerFn<SelectEndpointById<S["_unimplementedEndpoints"], Id>, R>,
  ) =>
  (api: S): AddServerHandle<S, Id, R> => {
    const endpoint = api._unimplementedEndpoints.find(
      ({ id: _id }) => _id === id,
    );

    if (endpoint === undefined) {
      throw new Error(`Operation id ${id} not found`);
    }

    const newUnimplementedEndpoints = api._unimplementedEndpoints.filter(
      ({ id: _id }) => _id !== id,
    );

    const handler = enhanceHandler(fn, endpoint);

    return {
      ...api,
      _unimplementedEndpoints: newUnimplementedEndpoints,
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
