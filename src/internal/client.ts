import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import type { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import type { AnyApi } from "../Api";
import {
  Client,
  httpClientError,
  unexpectedClientError,
  validationClientError,
} from "../Client";
import {
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
} from "../Server/Errors";
import { IgnoredSchemaId } from "./api";
import { getSchema } from "./utils";
import { getStructSchema } from "./utils";

const makeHttpCall = (
  method: string,
  baseUrl: URL,
  path: string,
  body: unknown,
  headers: Record<string, string>,
  query: Record<string, string>,
) =>
  pipe(
    Effect.tryPromise(() => {
      const url = new URL(baseUrl);
      url.pathname = path;

      Object.entries(query ?? {}).forEach(([name, value]) =>
        url.searchParams.set(name, value),
      );

      const options: RequestInit = {
        method: method.toUpperCase() as any,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: false,
      };

      return fetch(url, options);
    }),
    Effect.bindTo("response"),
    Effect.bind("json", ({ response }) =>
      Effect.tryPromise(async () => {
        const contentType = response.headers.get("content-type");
        const isJson =
          typeof contentType === "string" &&
          contentType.startsWith("application/json");

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

export const client =
  (baseUrl: URL) =>
  <A extends AnyApi>(api: A): Client<A> =>
    api.endpoints.reduce(
      (
        client,
        {
          id,
          method,
          path,
          schemas: { query, params, body, headers, response },
        },
      ) => {
        const parseResponse = Schema.parseEffect(response);
        const encodeQuery = Schema.encodeEffect(getStructSchema(query));
        const encodeParams = Schema.encodeEffect(getStructSchema(params));
        const encodeBody = Schema.encodeEffect(getSchema(body));
        const encodeHeaders = Schema.encodeEffect(getStructSchema(headers));

        const fn = (args: any) => {
          return pipe(
            Effect.all({
              query: parse(
                args["query"],
                encodeQuery,
                flow(invalidQueryError, validationClientError),
              ),
              params: parse(
                args["params"],
                encodeParams,
                flow(invalidParamsError, validationClientError),
              ),
              body: parse(
                args["body"],
                encodeBody,
                flow(invalidBodyError, validationClientError),
              ),
              headers: parse(
                args["headers"],
                encodeHeaders,
                invalidHeadersError,
              ),
            }),
            Effect.let("path", ({ params }) => constructPath(params, path)),
            Effect.tap(() => Effect.logTrace(`${method} ${path}`)),
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
            Effect.logAnnotate("clientOperationId", id),
          );
        };
        return { ...client, [id]: fn };
      },
      {} as Client<A>,
    );
