import { request } from "undici";

import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import type { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint } from "../Api";
import {
  Client,
  InvalidUrlClientError,
  httpClientError,
  invalidUrlError,
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
  url: URL,
  body: any,
  headers: any,
  query: any,
) =>
  pipe(
    Effect.tryPromise(() => {
      const options = {
        method: method.toUpperCase() as any,
        headers: { ...headers, "Content-Type": "application/json" },
        query,
        body: JSON.stringify(body),
      };
      return request(url, options);
    }),
    Effect.bindTo("response"),
    Effect.bind("json", ({ response }) =>
      Effect.tryPromise(async () => {
        const contentType = response.headers["content-type"];
        const isJson =
          typeof contentType === "string" &&
          contentType.startsWith("application/json");

        if (isJson) {
          return await response.body.json();
        } else {
          return await response.body.text();
        }
      }),
    ),
    Effect.map(({ response, json }) => ({
      content: json,
      statusCode: response.statusCode,
    })),
    Effect.mapError(unexpectedClientError),
  );

const constructUrl = (
  baseUrl: URL,
  params: Record<string, string>,
  path: string,
): Effect.Effect<never, InvalidUrlClientError, URL> =>
  pipe(
    Object.entries(params ?? {}).reduce(
      (path, [key, value]) => path.replace(`:${key}`, value),
      path,
    ),
    Effect.succeed,
    Effect.flatMap((finalPath) =>
      Effect.tryCatch(() => new URL(finalPath, baseUrl), invalidUrlError),
    ),
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

export const client =
  (baseUrl: URL) =>
  <Es extends Endpoint[]>(api: Api<Es>): Client<Es> =>
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
            Effect.bind("url", ({ params }) =>
              constructUrl(baseUrl, params as any, path),
            ),
            Effect.tap(({ url }) => Effect.logTrace(`${method} ${url}`)),
            Effect.flatMap(({ url, body, query, headers }) =>
              makeHttpCall(method, url, body, headers, query),
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
        return { ...(client as any), [id]: fn };
      },
      {} as Client<Es>,
    );
