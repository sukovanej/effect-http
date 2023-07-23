import { identity, pipe } from "@effect/data/Function";
import { isString } from "@effect/data/Predicate";
import * as Effect from "@effect/io/Effect";
import type { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint, EndpointSchemas } from "effect-http/Api";
import { IgnoredSchemaId } from "effect-http/Api";
import type { Client, ClientOptions } from "effect-http/Client";
import {
  httpClientError,
  unexpectedClientError,
  validationClientError,
} from "effect-http/ClientError";
import {
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
} from "effect-http/ServerError";
import { getSchema, isArray } from "effect-http/internal/utils";

const makeHttpCall = (
  method: string,
  baseUrl: URL,
  path: string,
  body: unknown,
  headers: Record<string, string>,
  query: Record<string, string>,
) =>
  pipe(
    Effect.tryPromiseInterrupt((signal) => {
      const url = new URL(baseUrl);
      url.pathname = path;

      Object.entries(query ?? {}).forEach(([name, value]) =>
        url.searchParams.set(name, value),
      );

      const contentType =
        body !== undefined ? { "Content-Type": "application/json" } : undefined;

      const options: RequestInit = {
        method: method.toUpperCase() as any,
        headers: { ...headers, ...contentType },
        body: JSON.stringify(body),
        keepalive: false,
        signal,
      };

      return fetch(url, options);
    }),
    Effect.bindTo("response"),
    Effect.bind("json", ({ response }) =>
      Effect.tryPromise(async () => {
        const contentLength = response.headers.get("Content-Length");

        if (contentLength && parseInt(contentLength, 10) === 0) {
          return Promise.resolve(undefined);
        }

        const contentType = response.headers.get("Content-Type");
        const isJson =
          isString(contentType) && contentType.startsWith("application/json");

        if (isJson) {
          return await response.json();
        } else {
          return await response.text();
        }
      }),
    ),
    Effect.map(({ response, json }) => ({
      content: json,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    })),
    Effect.mapError(unexpectedClientError),
  );

type Response = {
  status: number;
  content: unknown;
  headers: Record<string, string>;
};

const checkStatusCode = (response: Response) => {
  const code = response.status;

  if (code >= 200 && code < 300) {
    return Effect.succeed(response);
  }

  return Effect.fail(httpClientError(response.content, response.status));
};

const parse = <A, E>(
  a: A,
  encode: (i: unknown) => Effect.Effect<never, ParseError, any>,
  onError: (error: unknown) => E,
) =>
  pipe(
    a === IgnoredSchemaId ? Effect.succeed(undefined) : encode(a),
    Effect.mapError(onError),
  );

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

export const createRequestEncoder = (
  requestSchemas: Endpoint["schemas"]["request"],
) => {
  const encodeQuery = Schema.encode(getSchema(requestSchemas.query));
  const encodeParams = Schema.encode(getSchema(requestSchemas.params));
  const encodeBody = Schema.encode(getSchema(requestSchemas.body));
  const encodeHeaders = Schema.encode(getSchema(requestSchemas.headers));

  return (args: any) =>
    Effect.all({
      query: parse(args["query"], encodeQuery, (e) =>
        pipe(invalidQueryError(e), validationClientError),
      ),
      params: parse(args["params"], encodeParams, (e) =>
        pipe(invalidParamsError(e), validationClientError),
      ),
      body: parse(args["body"], encodeBody, (e) =>
        pipe(invalidBodyError(e), validationClientError),
      ),
      headers: parse(args["headers"], encodeHeaders, invalidHeadersError),
    });
};

const createResponseParser = (
  responseSchema: EndpointSchemas["response"],
): ((
  response: Response,
) => Effect.Effect<
  never,
  ParseError,
  { status: number; headers: unknown; content: unknown }
>) => {
  if (isArray(responseSchema)) {
    const schema = Schema.union(
      ...responseSchema.map((s) =>
        Schema.struct({
          status: Schema.literal(s.status),
          content: getSchema(s.content),
          headers: getSchema(
            s.headers,
            Schema.record(Schema.string, Schema.string),
          ),
        }),
      ),
    );

    return Schema.parse(schema);
  }

  const parseContent = Schema.parse(responseSchema);

  return (response: Response) =>
    pipe(
      parseContent(response.content),
      Effect.map((content) => ({ ...response, content })),
    );
};

export const client =
  <A extends Api, H extends Record<string, unknown>>(
    baseUrl: URL,
    options?: ClientOptions<H>,
  ) =>
  (api: A): Client<A, H> =>
    api.endpoints.reduce(
      (client, { id, method, path, schemas }) => {
        const parseResponse = createResponseParser(schemas.response);
        const encodeRequest = createRequestEncoder(schemas.request);
        const finalOptions: ClientOptions<any> = { headers: {}, ...options };

        const fn = (_args: any) => {
          const args = _args || {};

          return pipe(
            encodeRequest({
              ...args,
              headers: { ...finalOptions.headers, ...args.headers },
            }),
            Effect.let("path", ({ params }) => constructPath(params, path)),
            Effect.tap((args) => Effect.logTrace(`${method} ${path}, ${args}`)),
            Effect.flatMap(({ path, body, query, headers }) =>
              makeHttpCall(method, baseUrl, path, body, headers, query),
            ),
            Effect.flatMap(checkStatusCode),
            Effect.flatMap((response) =>
              pipe(
                parseResponse(response),
                Effect.mapError(validationClientError),
              ),
            ),
            isArray(schemas.response)
              ? identity
              : Effect.map(({ content }) => content),
            Effect.annotateLogs("clientOperationId", id),
          );
        };
        return { ...client, [id]: fn };
      },
      {} as Client<A, H>,
    );
