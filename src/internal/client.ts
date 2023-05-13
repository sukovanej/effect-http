import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import type { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import type { AnyApi } from "../Api";
import type { Client, ClientOptions } from "../Client/Client";
import {
  httpClientError,
  unexpectedClientError,
  validationClientError,
} from "../Client/Errors";
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

      const contentType =
        body !== undefined ? { "Content-Type": "application/json" } : undefined;

      const options: RequestInit = {
        method: method.toUpperCase() as any,
        headers: { ...headers, ...contentType },
        body: JSON.stringify(body),
        keepalive: false,
      };

      return fetch(url, options);
    }),
    Effect.bindTo("response"),
    Effect.bind("json", ({ response }) =>
      Effect.tryPromise(async () => {
        const contentType = response.headers.get("Content-Type");
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

export const createInputParser = ({
  query,
  params,
  body,
  headers,
}: AnyApi["endpoints"][number]["schemas"]) => {
  const encodeQuery = Schema.encodeEffect(getStructSchema(query));
  const encodeParams = Schema.encodeEffect(getStructSchema(params));
  const encodeBody = Schema.encodeEffect(getSchema(body));
  const encodeHeaders = Schema.encodeEffect(getStructSchema(headers));

  return (args: any) =>
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
      headers: parse(args["headers"], encodeHeaders, invalidHeadersError),
    });
};

export const client =
  <A extends AnyApi, H extends Record<string, unknown>>(
    baseUrl: URL,
    options?: ClientOptions<H>,
  ) =>
  (api: A): Client<A, H> =>
    api.endpoints.reduce((client, { id, method, path, schemas }) => {
      const parseResponse = Schema.parseEffect(schemas.response);
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
    }, {} as Client<A, H>);
