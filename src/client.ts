import { request } from "undici";

import * as Context from "@effect/data/Context";
import { flow, pipe } from "@effect/data/Function";
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

type Client<Es extends Endpoint[]> = S.Spread<{
  [Id in Es[number]["id"]]: (
    input: EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
  ) => Effect.Effect<
    never,
    ClientError,
    S.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
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

export const client =
  (baseUrl: URL) =>
  <Es extends Endpoint[]>(api: Api<Es>): Client<Es> =>
    api.endpoints.reduce(
      (
        client,
        { id, method, path, schemas: { query, params, body, response } },
      ) => {
        const parseResponse = S.parseEffect(response);
        const encodeQuery = S.encodeEffect(
          query === IgnoredSchemaId ? S.unknown : (S.struct(query) as any),
        );
        const encodeParams = S.encodeEffect(
          params === IgnoredSchemaId ? S.unknown : (S.struct(params) as any),
        );
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
            Effect.bind("url", ({ params }) =>
              constructUrl(baseUrl, params as any, path),
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
