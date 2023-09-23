/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import { ParseResult, Schema } from "@effect/schema";
import { Effect, type Types, identity, pipe } from "effect";
import type {
  Api,
  Endpoint,
  EndpointSchemas,
  ResponseSchemaFull,
} from "effect-http/Api";
import type { ClientError } from "effect-http/ClientError";
import {
  httpClientError,
  unexpectedClientError,
  validationClientError,
} from "effect-http/ClientError";
import type {
  EndpointSchemasTo,
  ResponseSchemaFullTo,
  SelectEndpointById,
} from "effect-http/ServerBuilder";
import {
  createRequestEncoder,
  createResponseSchema,
  getResponseContent,
  isArray,
} from "effect-http/internal/utils";

/**
 * @category models
 * @since 1.0.0
 */
export type Client<A extends Api, H> = A extends Api<infer Es>
  ? Types.Simplify<{
      [Id in Es[number]["id"]]: ClientFunction<
        Es,
        Id,
        MakeHeadersOptionIfAllPartial<
          DropCommonHeaders<
            EndpointSchemasTo<SelectEndpointById<Es, Id>["schemas"]>["request"],
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
export interface ClientOptions<H extends Record<string, unknown>> {
  headers: H;
}

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
    Effect.tryPromise((signal) => {
      const url = new URL(baseUrl);
      url.pathname = path;

      Object.entries(query ?? {}).forEach(([name, value]) =>
        url.searchParams.set(name, value),
      );

      const contentType =
        body !== undefined && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : undefined;

      const options: RequestInit = {
        method: method.toUpperCase() as any,
        headers: { ...headers, ...contentType },
        body: body instanceof FormData ? body : JSON.stringify(body),
        keepalive: false,
        signal,
      };

      return fetch(url, options);
    }),
    Effect.bindTo("response"),
    Effect.bind("content", ({ response }) => getResponseContent(response)),
    Effect.map(({ response, content }) => ({
      content,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    })),
    Effect.mapError(unexpectedClientError),
  );

/** @ignore */
type Response = {
  status: number;
  content: unknown;
  headers: Record<string, string>;
};

/** @internal */
const checkStatusCode = (response: Response) => {
  const code = response.status;

  if (code >= 200 && code < 300) {
    return Effect.succeed(response);
  }

  return Effect.fail(httpClientError(response.content, response.status));
};

/** @internal */
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

/** @internal */
export const createResponseParser = (
  responseSchema: EndpointSchemas["response"],
): ((
  response: Response,
) => Effect.Effect<
  never,
  ParseResult.ParseError,
  { status: number; headers: unknown; content: unknown }
>) => {
  const parseContent = Schema.parse(createResponseSchema(responseSchema));
  const isFullResponse = isArray(responseSchema);

  return (response: Response) => {
    if (isFullResponse) {
      return parseContent(response);
    }

    return pipe(
      parseContent(response.content),
      Effect.map((content) => ({ ...response, content })),
    );
  };
};

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const client = <
  A extends Api,
  H extends Record<string, unknown> = Record<never, never>,
>(
  api: A,
  baseUrl: URL,
  options?: ClientOptions<H>,
): Client<A, H> =>
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

// Internal type helpers

/** @ignore */
type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Types.Simplify<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;

/** @ignore */
type DropCommonHeaders<I, CommonHeaders> = Types.Simplify<{
  [K in keyof I]: K extends "headers"
    ? Types.Simplify<
        {
          [HK in Extract<keyof I[K], keyof CommonHeaders>]?: I[K][HK];
        } & Pick<I[K], Exclude<keyof I[K], keyof CommonHeaders>>
      >
    : I[K];
}>;

/** @ignore */
export type ClientFunctionResponse<S extends Endpoint["schemas"]["response"]> =
  Types.Simplify<
    S extends Schema.Schema<any, infer A>
      ? A
      : S extends readonly ResponseSchemaFull[]
      ? ResponseSchemaFullTo<S[number]>
      : S extends ResponseSchemaFull
      ? ResponseSchemaFullTo<S>
      : never
  >;

/** @ignore */
type ClientFunction<Es extends Endpoint[], Id, I> = Record<
  string,
  never
> extends I
  ? (
      input?: I,
    ) => Effect.Effect<
      never,
      ClientError,
      ClientFunctionResponse<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >
  : (
      input: I,
    ) => Effect.Effect<
      never,
      ClientError,
      ClientFunctionResponse<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >;
