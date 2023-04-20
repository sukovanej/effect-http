import { request } from "undici";

import * as Context from "@effect/data/Context";
import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import { Api, Endpoint, IgnoredSchemaId } from "./api";
import {
  ApiError,
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
} from "./errors";
import {
  EndpointSchemasToInput,
  SelectEndpointById,
  getSchema,
} from "./internal";

export type HttpClientProviderOptions = {
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
};

export type ApiConnectionError = {
  _tag: "ApiConnectionError";
  error: unknown;
};

export type InvalidUrlError = {
  _tag: "InvalidUrlError";
  error: unknown;
};
const invalidUrlError = (error: unknown): InvalidUrlError => ({
  _tag: "InvalidUrlError",
  error,
});

export type UnexpectedClientError = {
  _tag: "UnexpectedClientError";
  error: unknown;
};

const unexpectedClientError = (error: unknown): UnexpectedClientError => ({
  _tag: "UnexpectedClientError",
  error,
});

export type ClientValidationError = {
  _tag: "ClientValidationError";
  error: unknown;
};

const clientValidationError = (error: unknown): ClientValidationError => ({
  _tag: "ClientValidationError",
  error,
});

export type HttpClientError = {
  _tag: "HttpClientError";
  statusCode: number;
  error: unknown;
};

const httpClientError = (
  error: unknown,
  statusCode: number,
): HttpClientError => ({
  _tag: "HttpClientError",
  statusCode,
  error,
});

export type ClientError =
  | ApiError
  | ApiConnectionError
  | HttpClientError
  | InvalidUrlError
  | UnexpectedClientError;

type Response = { statusCode: number; content: unknown };

export type HttpClientProvider = (
  method: string,
  url: URL,
  options: HttpClientProviderOptions,
) => Effect.Effect<never, ClientError, Response>;

export const HttpClientProviderService = Context.Tag<HttpClientProvider>(
  "effect-http/context/HttpClientProviderService",
);

type Client<Es extends Endpoint[]> = Schema.Spread<{
  [Id in Es[number]["id"]]: (
    input: EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
  ) => Effect.Effect<
    never,
    ClientError,
    Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
  >;
}>;

const nodeHttpClientProvider: HttpClientProvider = (
  method,
  url,
  { body, headers, query },
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
): Effect.Effect<never, InvalidUrlError, URL> => {
  const finalPath = Object.entries(params ?? {}).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    path,
  );

  try {
    const url = new URL(finalPath, baseUrl);
    return Effect.succeed(url);
  } catch (error) {
    return Effect.fail(invalidUrlError(JSON.stringify(error)));
  }
};

const checkStatusCode = (response: Response) => {
  const code = response.statusCode;

  if (code === 200 || code === 201) {
    return Effect.succeed(response);
  }

  if (code >= 400 && code < 500) {
    return Effect.fail(httpClientError(response.content, response.statusCode));
  }

  return Effect.fail<ClientError>(
    unexpectedClientError(
      new Error(`Failed with unexpected status code ${code}`),
    ),
  );
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
        const encodeQuery = Schema.encodeEffect(
          query === IgnoredSchemaId
            ? Schema.unknown
            : (Schema.struct(query) as any),
        );
        const encodeParams = Schema.encodeEffect(
          params === IgnoredSchemaId
            ? Schema.unknown
            : (Schema.struct(params) as any),
        );
        const encodeBody = Schema.encodeEffect(getSchema(body));
        const encodeHeaders = Schema.encodeEffect(
          headers === IgnoredSchemaId
            ? Schema.unknown
            : (Schema.struct(headers) as any),
        );

        const fn = (args: any) => {
          return pipe(
            Effect.Do(),
            Effect.bind("query", () =>
              parse(args["query"], encodeQuery, invalidQueryError),
            ),
            Effect.bind("params", () =>
              parse(args["params"], encodeParams, invalidParamsError),
            ),
            Effect.bind("body", () =>
              parse(args["body"], encodeBody, invalidBodyError),
            ),
            Effect.bind("headers", () =>
              parse(args["headers"], encodeHeaders, invalidHeadersError),
            ),
            Effect.bind("url", ({ params }) =>
              constructUrl(baseUrl, params as any, path),
            ),
            Effect.tap(({ url }) => Effect.logTrace(`${method} ${url}`)),
            Effect.flatMap(({ url, body, query, headers }) =>
              Effect.flatMap(HttpClientProviderService, (provider) =>
                provider(method, url, {
                  body,
                  headers,
                  query: query as any,
                }),
              ),
            ),
            Effect.flatMap(checkStatusCode),
            Effect.map(({ content }) => content),
            Effect.flatMap(
              flow(parseResponse, Effect.mapError(clientValidationError)),
            ),
            Effect.provideService(
              HttpClientProviderService,
              nodeHttpClientProvider,
            ),
            Effect.logAnnotate("clientOperationId", id),
          );
        };
        return { ...(client as any), [id]: fn };
      },
      {} as Client<Es>,
    );
