import { pipe } from "@effect/data/Function";
import { isString } from "@effect/data/Predicate";
import * as Effect from "@effect/io/Effect";
import type { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import type { Api } from "effect-http/Api";
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
import { getSchema } from "effect-http/internal/utils";
import { getStructSchema } from "effect-http/internal/utils";

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
      statusCode: response.status,
    })),
    Effect.mapError(unexpectedClientError),
  );

type Response = { statusCode: number; content: unknown };

const checkStatusCode = (response: Response) => {
  const code = response.statusCode;

  if (code === 200 || code === 201) {
    return Effect.succeed(response);
  }

  return Effect.fail(httpClientError(response.content, response.statusCode));
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

const constructPath = (params: Record<string, string>, path: string) =>
  Object.entries(params ?? {}).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    path,
  );

export const createInputParser = ({
  query,
  params,
  body,
  headers,
}: Api["endpoints"][number]["schemas"]) => {
  const encodeQuery = Schema.encode(getStructSchema(query));
  const encodeParams = Schema.encode(getStructSchema(params));
  const encodeBody = Schema.encode(getSchema(body));
  const encodeHeaders = Schema.encode(getStructSchema(headers));

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

export const client =
  <A extends Api, H extends Record<string, unknown>>(
    baseUrl: URL,
    options?: ClientOptions<H>,
  ) =>
  (api: A): Client<A, H> =>
    api.endpoints.reduce(
      (client, { id, method, path, schemas }) => {
        const parseResponse = Schema.parse(schemas.response);
        const parseInputs = createInputParser(schemas);

        const finalOptions: ClientOptions<any> = { headers: {}, ...options };

        const fn = (_args: any) => {
          const args = _args || {};

          return pipe(
            parseInputs({
              ...args,
              headers: { ...finalOptions.headers, ...args.headers },
            }),
            Effect.let("path", ({ params }) => constructPath(params, path)),
            Effect.tap(() => Effect.log(`${method} ${path}`, "Trace")),
            Effect.flatMap(({ path, body, query, headers }) =>
              makeHttpCall(method, baseUrl, path, body, headers, query),
            ),
            Effect.flatMap(checkStatusCode),
            Effect.flatMap(({ content }) =>
              pipe(
                parseResponse(content),
                Effect.mapError(validationClientError),
              ),
            ),
            Effect.annotateLogs("clientOperationId", id),
          );
        };
        return { ...client, [id]: fn };
      },
      {} as Client<A, H>,
    );
