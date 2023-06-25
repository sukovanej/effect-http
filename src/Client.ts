/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type {
  Api,
  Endpoint,
  ResponseSchemaFull,
  SchemasMap,
  SchemasMapTo,
} from "effect-http/Api";
import type { ClientError } from "effect-http/ClientError";
import type {
  EndpointSchemasToInput,
  SelectEndpointById,
} from "effect-http/Server";
import * as internal from "effect-http/internal/client";

/** @ignore */
type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Schema.Spread<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;

/** @ignore */
type DropCommonHeaders<I, CommonHeaders> = {
  [K in keyof I]: K extends "headers"
    ? Schema.Spread<
        {
          [HK in Extract<keyof I[K], keyof CommonHeaders>]?: I[K][HK];
        } & {
          [HK in Exclude<keyof I[K], keyof CommonHeaders>]: I[K][HK];
        }
      >
    : I[K];
};

type ResponseSchemaFullToInput<R extends ResponseSchemaFull> = R extends any
  ? {
      headers: R["headers"] extends SchemasMap<string>
        ? Schema.Spread<SchemasMapTo<R["headers"]>>
        : Record<string, string>;
      content: R["content"] extends Schema.Schema<any, infer A> ? A : unknown;
      status: R["status"];
    }
  : never;

/** @ignore */
export type ClientFunctionResponse<S extends Endpoint["schemas"]["response"]> =
  Schema.Spread<
    S extends Schema.Schema<any, infer A>
      ? A
      : S extends readonly ResponseSchemaFull[]
      ? ResponseSchemaFullToInput<S[number]>
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

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const client: <
  A extends Api,
  H extends Record<string, unknown> = Record<never, never>,
>(
  baseUrl: URL,
  options?: ClientOptions<H>,
) => (api: A) => Client<A, H> = internal.client;
