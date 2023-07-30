/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { Api } from "effect-http/Api";
import {
  ClientFunctionResponse,
  createResponseParser,
} from "effect-http/Client";
import { buildServer } from "effect-http/Server";
import type {
  EndpointSchemasTo,
  SelectEndpointById,
  ServerBuilder,
} from "effect-http/ServerBuilder";
import {
  createRequestEncoder,
  getResponseContent,
  isArray,
} from "effect-http/internal";

import { httpClientError } from "./ClientError";

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

              const init = { body, headers, method };
              const request = new Request(url, init);

              const response = yield* _(handler.fn(request));

              const content = yield* _(getResponseContent(response));
              const responseHeaders = Object.fromEntries(
                response.headers.entries(),
              );
              const status = response.status;

              if (status < 200 || status >= 300) {
                return yield* _(Effect.fail(httpClientError(content, status)));
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

// Internal type helpers

/** @ignore */
export type TestingClient<R, A extends Api> = A extends Api<infer Es>
  ? Schema.Spread<{
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
  ? Schema.Spread<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;
