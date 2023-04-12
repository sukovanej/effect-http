import http from "http";
import https from "https";
import { request } from "undici";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import { Api, Endpoint, IgnoredSchemaId } from "./api";
import {
  ApiError,
  invalidBodyError,
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

export type UnexpectedClientError = {
  _tag: "UnexpectedClientError";
  error: unknown;
};

const unexpectedClientError = (error: unknown): UnexpectedClientError => ({
  _tag: "UnexpectedClientError",
  error,
});

export type ClientError =
  | ApiError
  | ApiConnectionError
  | InvalidUrlError
  | UnexpectedClientError;

type Response = { statusCode: number; content: unknown };

export type HttpClientProvider = (
  method: string,
  url: URL,
  options: HttpClientProviderOptions,
) => Effect.Effect<never, ClientError, Response>;

export const HttpClientProviderService = Context.Tag<HttpClientProvider>();

type Client<Es extends Endpoint[]> = S.Spread<{
  [Id in Es[number]["id"]]: (
    input: EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
  ) => Effect.Effect<
    never,
    ClientError,
    SelectEndpointById<Es, Id>["schemas"]["response"]
  >;
}>;

const nodeHttpClientProvider: HttpClientProvider = (
  method,
  url,
  { body, headers, query },
) =>
  pipe(
    Effect.tryPromise(() =>
      request(url, {
        method: method.toUpperCase() as any,
        headers: { ...headers, "Content-Type": "application/json" },
        query,
        body: JSON.stringify(body),
      }),
    ),
    Effect.bindTo("response"),
    Effect.bind("json", ({ response }) =>
      Effect.promise(async () => {
        if (response.headers["Content-Type"] === "application/json") {
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
  path: string,
  query: unknown,
  params: unknown,
): Effect.Effect<never, InvalidUrlError, URL> => {
  try {
    const url = new URL(path, baseUrl);

    if (query !== IgnoredSchemaId) {
      for (const [k, v] of new URLSearchParams(query as any).entries()) {
        url.searchParams.set(k, v);
      }
    }

    return Effect.succeed(url);
  } catch (error) {
    return Effect.fail({ _tag: "InvalidUrlError" as const, error });
  }
};

const checkStatusCode = (response: Response) => {
  const code = response.statusCode;

  if (code === 200 || code === 201) {
    return Effect.succeed(response);
  }

  if (code === 400) {
    return Effect.fail<ApiError>(invalidBodyError(response.statusCode));
  }

  return Effect.fail<ClientError>(
    unexpectedClientError(
      new Error(`Failed with unexpected status code ${code}`),
    ),
  );
};

export const client =
  (baseUrl: URL) =>
  <Es extends Endpoint[]>(api: Api<Es>): Client<Es> =>
    api.reduce(
      (
        client,
        { id, method, path, schemas: { query, params, body, response } },
      ) => {
        const parseResponse = S.parseEffect(response);
        const encodeQuery = S.encodeEffect(getSchema(query));
        const encodeParams = S.encodeEffect(getSchema(params));
        const encodeBody = S.encodeEffect(getSchema(body));

        const fn = (args: any) => {
          return pipe(
            Effect.Do(),
            Effect.bind("query", () =>
              pipe(
                args["query"] === IgnoredSchemaId
                  ? Effect.succeed(undefined)
                  : encodeQuery(args["query"]),
                Effect.mapError(invalidQueryError),
              ),
            ),
            Effect.bind("params", () =>
              pipe(
                args["params"] === IgnoredSchemaId
                  ? Effect.succeed(undefined)
                  : encodeParams(args["params"]),
                Effect.mapError(invalidParamsError),
              ),
            ),
            Effect.bind("body", () =>
              pipe(
                args["body"] === IgnoredSchemaId
                  ? Effect.succeed(undefined)
                  : encodeBody(args["body"]),
                Effect.mapError(invalidBodyError),
              ),
            ),
            Effect.bind("url", ({ query, params }) =>
              constructUrl(baseUrl, path, query, params),
            ),
            Effect.tap(({ url }) => Effect.logTrace(`${method} ${url}`)),
            Effect.flatMap(({ url, body, query }) =>
              Effect.flatMap(HttpClientProviderService, (provider) =>
                provider(method, url, {
                  body,
                  headers: {},
                  query: query as any,
                }),
              ),
            ),
            Effect.flatMap(checkStatusCode),
            Effect.map(({ content }) => content),
            Effect.flatMap(parseResponse),
            Effect.provideService(
              HttpClientProviderService,
              nodeHttpClientProvider,
            ),
            Effect.logAnnotate("clientOperationId", id),
            Effect.logAnnotate("side", "client"),
          );
        };
        return { ...(client as any), [id]: fn };
      },
      {} as Client<Es>,
    );
