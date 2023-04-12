import http from "http";
import https from "https";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import { Api, Endpoint, IgnoredSchemaId } from "./api";
import { ApiError, invalidBodyError } from "./errors";
import { EndpointSchemasToInput, SelectEndpointById } from "./internal";

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
    Effect.tryPromise(
      () =>
        new Promise<Response>((resolve, reject) => {
          const options = { headers, method };

          const client =
            url.protocol === "http:"
              ? http
              : url.protocol === "https:"
              ? https
              : undefined;

          if (client === undefined) {
            reject({
              _tag: "InvalidUrlError" as const,
              error: new Error(`Unexpected protocol ${url.protocol}`),
            });
            return;
          }

          const req = http.get(url, { ...options }, (res) => {
            let data: Uint8Array[] = [];

            res.on("data", (chunk) => {
              data.push(chunk);
            });

            res.on("end", () => {
              let content = Buffer.concat(data).toString();

              if (res.headers["content-type"] === "application/json") {
                content = JSON.parse(content);
              } else {
                content = content;
              }

              if (res.statusCode === undefined) {
                reject(unexpectedClientError(new Error("Missing status code")));
                return;
              }

              resolve({ statusCode: res.statusCode, content });
            });

            res.on("error", reject);
          });

          if (body) {
            req.write(JSON.stringify(body));
          }
        }),
    ),
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

        const fn = (args: any) => {
          let requestBody: unknown = undefined;

          if (body !== IgnoredSchemaId) {
            requestBody = args["body"];
          }

          return pipe(
            constructUrl(
              baseUrl,
              path,
              args["query"] === IgnoredSchemaId ? {} : args["query"],
              args["params"] === IgnoredSchemaId ? {} : args["params"],
            ),
            Effect.tap((url) =>
              pipe(
                Effect.logInfo(`${method} ${url}`),
                Effect.logAnnotate("clientOperationId", id),
              ),
            ),
            Effect.flatMap((url) =>
              Effect.flatMap(HttpClientProviderService, (provider) =>
                provider(method, url, {
                  body: requestBody,
                  headers: {},
                  query: args["query"],
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
          );
        };
        return { ...(client as any), [id]: fn };
      },
      {} as Client<Es>,
    );
