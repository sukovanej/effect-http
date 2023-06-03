/**
 * @since 1.0.0
 */
import { flow, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

import { Api, Endpoint } from "effect-http/Api";
import {
  EndpointSchemasToInput,
  SelectEndpointById,
  invalidBodyError,
  invalidHeadersError,
  invalidParamsError,
  invalidQueryError,
} from "effect-http/Server";

import { IgnoredSchemaId } from "./internal/api";
import { getSchema, getStructSchema } from "./internal/utils";

/**
 * @category error models
 * @since 1.0.0
 */
export type InvalidUrlClientError = {
  _tag: "InvalidUrlClientError";
  error: unknown;
};

/**
 * @category error constructors
 * @since 1.0.0
 */
export const invalidUrlError = (error: unknown): InvalidUrlClientError => ({
  _tag: "InvalidUrlClientError",
  error,
});

/**
 * @category error models
 * @since 1.0.0
 */
export type UnexpectedClientError = {
  _tag: "UnexpectedClientError";
  error: unknown;
};

/**
 * @category error constructors
 * @since 1.0.0
 */
export const unexpectedClientError = (
  error: unknown,
): UnexpectedClientError => ({
  _tag: "UnexpectedClientError",
  error,
});

/**
 * @category error models
 * @since 1.0.0
 */
export type ValidationClientError = {
  _tag: "ValidationClientError";
  error: unknown;
};

/**
 * @category error constructors
 * @since 1.0.0
 */
export const validationClientError = (
  error: unknown,
): ValidationClientError => ({
  _tag: "ValidationClientError",
  error,
});

/**
 * @category error models
 * @since 1.0.0
 */
export type HttpClientError = {
  _tag: "HttpClientError";
  statusCode: number;
  error: unknown;
};

/**
 * @category error constructors
 * @since 1.0.0
 */
export const httpClientError = (
  error: unknown,
  statusCode: number,
): HttpClientError => ({
  _tag: "HttpClientError",
  statusCode,
  error,
});

/**
 * @category error models
 * @since 1.0.0
 */
export type ClientError =
  | InvalidUrlClientError
  | HttpClientError
  | ValidationClientError
  | UnexpectedClientError;

type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Schema.Spread<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;

type DropCommonHeaders<I, H> = {
  [K in keyof I]: K extends "headers"
    ? Schema.Spread<
        {
          [HK in Extract<keyof H, keyof I[K]>]?: I[K][HK];
        } & {
          [HK in Exclude<keyof I[K], keyof H>]: I[K][HK];
        }
      >
    : I[K];
};

type ClientFunction<Es extends Endpoint[], Id, I> = Record<
  string,
  never
> extends I
  ? (
      input?: I,
    ) => Effect.Effect<
      never,
      ClientError,
      Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >
  : (
      input: I,
    ) => Effect.Effect<
      never,
      ClientError,
      Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >;

/**
 * @category models
 * @since 1.0.0
 */
export type Client<A extends Api, H> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]["id"]]: ClientFunction<
        Es,
        Id,
        MakeHeadersOptionIfAllPartial<
          DropCommonHeaders<
            EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
            H
          >
        >
      >;
    }>
  : never;

/**
 * @category models
 * @since 1.0.0
 */
export type ClientOptions<H extends Record<string, unknown>> = {
  headers: H;
};

/** @internal */
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

/** @internal */
type Response = { statusCode: number; content: unknown };

/** @internal */
const checkStatusCode = (response: Response) => {
  const code = response.statusCode;

  if (code === 200 || code === 201) {
    return Effect.succeed(response);
  }

  return Effect.fail(httpClientError(response.content, response.statusCode));
};

/** @internal */
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

/** @internal */
export const createInputParser = ({
  query,
  params,
  body,
  headers,
}: Api["endpoints"][number]["schemas"]) => {
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

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const client =
  <A extends Api, H extends Record<string, unknown>>(
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
