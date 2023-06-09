/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint } from "effect-http/Api";
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

/**
 * Derive client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const client: <A extends Api, H extends Record<string, unknown>>(
  baseUrl: URL,
  options?: ClientOptions<H>,
) => (api: A) => Client<A, H> = internal.client;
