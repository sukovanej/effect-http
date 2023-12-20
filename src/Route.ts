/**
 * Create @effect/platform/Http/Router `Router`
 *
 * @since 1.0.0
 */
import type * as Router from "@effect/platform/Http/Router";
import type * as Schema from "@effect/schema/Schema";
import type * as Effect from "effect/Effect";
import type * as Types from "effect/Types";

import type * as Api from "./Api.js";
import type * as RouterBuilder from "./RouterBuilder.js";
import type * as ServerError from "./ServerError.js";
import * as internal from "./internal/route.js";
import type * as utils from "./internal/utils.js";

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerFunction<Endpoint extends Api.Endpoint, R, E> = (
  input: Types.Simplify<EndpointSchemasTo<Endpoint["schemas"]>["request"]>,
) => Effect.Effect<
  R,
  E,
  EndpointResponseSchemaTo<Endpoint["schemas"]["response"]>
>;

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromEndpoint: <Endpoint extends Api.Endpoint, R, E>(
  fn: HandlerFunction<Endpoint, R, E>,
  options?: RouterBuilder.Options,
) => (
  endpoint: Endpoint,
) => Router.Route<R, Exclude<E, ServerError.ServerError>> =
  internal.fromEndpoint;

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <
  A extends Api.Api,
  Id extends A["endpoints"][number]["id"],
  R,
  E,
>(
  id: Id,
  fn: HandlerFunction<Extract<A["endpoints"][number], { id: Id }>, R, E>,
  options?: RouterBuilder.Options,
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>> =
  internal.make;

/** @ignore */
type EndpointResponseSchemaTo<S> = S extends Schema.Schema<any>
  ? utils.SchemaTo<S>
  : S extends readonly Api.ResponseSchemaFull[]
    ? ResponseSchemaFullTo<S[number]>
    : S extends Api.ResponseSchemaFull
      ? ResponseSchemaFullTo<S>
      : never;

/** @ignore */
export type ResponseSchemaFullTo<S extends Api.ResponseSchemaFull> =
  S extends any
    ? Types.Simplify<
        {
          status: S["status"];
        } & {
          [K in Exclude<
            RequiredFields<S>,
            "status" | "representations"
          >]: S[K] extends Schema.Schema<any> ? utils.SchemaTo<S[K]> : never;
        }
      >
    : never;

/** @ignore */
type RequiredFields<E> = {
  [K in keyof E]: E[K] extends Api.IgnoredSchemaId ? never : K;
}[keyof E];

/** @ignore */
export type EndpointSchemasTo<E extends Api.Endpoint["schemas"]> =
  Types.Simplify<{
    response: EndpointResponseSchemaTo<E["response"]>;
    request: {
      [K in Extract<
        keyof E["request"],
        RequiredFields<E["request"]>
      >]: utils.SchemaTo<E["request"][K]>;
    };
  }>;
