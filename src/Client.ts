/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { Api, Endpoint, ResponseSchemaFull } from "effect-http/Api";
import type { ClientError } from "effect-http/ClientError";
import type {
  EndpointSchemasTo,
  ResponseSchemaFullTo,
  SelectEndpointById,
} from "effect-http/ServerBuilder";
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
type DropCommonHeaders<I, CommonHeaders> = Schema.Spread<{
  [K in keyof I]: K extends "headers"
    ? Schema.Spread<
        {
          [HK in Extract<keyof I[K], keyof CommonHeaders>]?: I[K][HK];
        } & Pick<I[K], Exclude<keyof I[K], keyof CommonHeaders>>
      >
    : I[K];
}>;

/** @ignore */
export type ClientFunctionResponse<S extends Endpoint["schemas"]["response"]> =
  Schema.Spread<
    S extends Schema.Schema<any, infer A>
      ? A
      : S extends readonly ResponseSchemaFull[]
      ? ResponseSchemaFullTo<S[number]>
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
