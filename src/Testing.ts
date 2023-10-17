/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import { ParseResult, Schema } from "@effect/schema";
import { Effect, type Types, pipe } from "effect";
import type { Api, EndpointSchemas } from "effect-http/Api";
import { ClientFunctionResponse } from "effect-http/Client";
import * as ClientError from "effect-http/ClientError";
import { buildServer } from "effect-http/Server";
import type {
  EndpointSchemasTo,
  SelectEndpointById,
  ServerBuilder,
} from "effect-http/ServerBuilder";
import {
  createRequestEncoder,
  createResponseSchema,
  getResponseContent,
  isArray,
} from "effect-http/internal/utils";

/**
 * Create a testing client for the `Server`. It generates a similar interface
 * as the `Http.client` but instead of remote Http calls it performs direct
 * handler invocations and returns a `Response` object.
 *
 * All the validations and `Request` / `Response` conversions are actually
 * triggered, the network part is bypassed.
 *
 * Server dependencies are propagated to the `Effect` context. Thus, if your
 * server implementation involves the usage of services, you need to
 * satisfy the conctract in your tests.
 *
 * @category constructors
 * @since 1.0.0
 */
export const testingClient = <R, A extends Api>(
  serverBuilder: ServerBuilder<R, [], A>,
): TestingClient<R, A> => {
  const server = buildServer(serverBuilder);

  return server.api.endpoints.reduce(
    (client, { id, method, path, schemas }) => {
      const parseInputs = createRequestEncoder(schemas.request);
      const parseResponse = createResponseParser(schemas.response);

      const handler = server.handlers.find(
        ({ endpoint }) => endpoint.id === id,
      );

      if (handler === undefined) {
        throw new Error(`Couldn't find server implementation for ${id}`);
      }

      const fn = (_args: any) => {
        const args = _args || {};

        return pipe(
          parseInputs(args),
          Effect.tap(() => Effect.logTrace(`${method} ${path}`)),
          Effect.flatMap(({ body, query, params, headers }) =>
            Effect.gen(function* (_) {
              const pathStr = Object.entries(params ?? {}).reduce(
                (path, [key, value]) => path.replace(`:${key}`, value as any),
                path,
              );

              const url = new URL(`http://localhost${pathStr}`);

              Object.entries(query ?? {}).forEach(([name, value]) =>
                url.searchParams.set(name, value as any),
              );

              const _body =
                body !== undefined ? JSON.stringify(body) : undefined;
              const contentLength = _body && _body.length;
              const contentType = _body && "application/json";

              const init = {
                body: _body,
                headers: {
                  ...headers,
                  ...(contentLength && { "content-length": contentLength }),
                  ...(contentType && { "content-type": contentType }),
                },
                method,
              };
              const request = new Request(url, init);

              const response = yield* _(handler.fn(request));

              const content = yield* _(getResponseContent(response));
              const responseHeaders = Object.fromEntries(
                response.headers.entries(),
              );
              const status = response.status;

              if (status < 200 || status >= 300) {
                return yield* _(
                  Effect.fail(
                    ClientError.HttpClientError.create(content, status),
                  ),
                );
              }

              const parsedResponse = yield* _(
                parseResponse({ content, headers: responseHeaders, status }),
              );

              if (isArray(schemas.response)) {
                return parsedResponse;
              }

              return parsedResponse.content;
            }),
          ),
          Effect.annotateLogs("clientOperationId", id),
        );
      };
      return { ...client, [id]: fn };
    },
    {} as TestingClient<R, A>,
  );
};

/** @ignore */
type Response = {
  status: number;
  content: unknown;
  headers: Record<string, string>;
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

// Internal type helpers

/** @ignore */
export type TestingClient<R, A extends Api> = A extends Api<infer Es>
  ? Types.Simplify<{
      [Id in Es[number]["id"]]: TestClientFunction<
        R,
        MakeHeadersOptionIfAllPartial<
          EndpointSchemasTo<SelectEndpointById<Es, Id>["schemas"]>["request"]
        >,
        ClientFunctionResponse<
          SelectEndpointById<Es, Id>["schemas"]["response"]
        >
      >;
    }>
  : never;

/** @ignore */
type TestClientFunction<R, I, Response> = Record<string, never> extends I
  ? (input?: I) => Effect.Effect<R, unknown, Response>
  : (input: I) => Effect.Effect<R, unknown, Response>;

/** @ignore */
type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Types.Simplify<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;
