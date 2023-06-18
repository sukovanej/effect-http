/**
 * Testing if the `Server` implementation.
 *
 * @since 1.0.0
 */
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { Api } from "effect-http/Api";
import type {
  EndpointSchemasToInput,
  SelectEndpointById,
  Server,
} from "effect-http/Server";
import { createInputParser } from "effect-http/internal/client";

import { runHandlerFnWithExtensions } from "./internal/express";

/** @ignore */
type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Schema.Spread<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;

/**
 * @category models
 * @since 1.0.0
 */
type TestClientFunction<I> = Record<string, never> extends I
  ? (input?: I) => Effect.Effect<never, unknown, Response>
  : (input: I) => Effect.Effect<never, unknown, Response>;

/**
 * @category models
 * @since 1.0.0
 */
export type TestingClient<A extends Api> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]["id"]]: TestClientFunction<
        MakeHeadersOptionIfAllPartial<
          EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>
        >
      >;
    }>
  : never;

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
  server: Server<R, [], A>,
): Effect.Effect<R, never, TestingClient<A>> =>
  pipe(
    Effect.runtime<R>(),
    Effect.map((runtime) =>
      server.api.endpoints.reduce((client, { id, method, path, schemas }) => {
        const parseInputs = createInputParser(schemas);

        const handler = server.handlers.find(
          ({ endpoint }) => endpoint.id === id,
        );

        if (handler === undefined) {
          throw new Error(`Couldn't find server implementation for ${id}`);
        }

        const handleFn = runHandlerFnWithExtensions(server.extensions, handler);

        const fn = (_args: any) => {
          const args = _args || {};

          return pipe(
            parseInputs(args),
            Effect.tap(() => Effect.logTrace(`${method} ${path}`)),
            Effect.flatMap(({ body, query, params, headers }) => {
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

              return handleFn(request);
            }),
            Effect.logAnnotate("clientOperationId", id),
            Effect.provideContext(runtime.context),
          );
        };
        return { ...client, [id]: fn };
      }, {} as TestingClient<A>),
    ),
  );
