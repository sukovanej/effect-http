/**
 * Create @effect/platform/Http/Router `Router`
 *
 * @since 1.0.0
 */
import type * as Router from "@effect/platform/Http/Router"
import type * as ParseResult from "@effect/schema/ParseResult"
import type * as Schema from "@effect/schema/Schema"
import type * as Effect from "effect/Effect"
import type * as Either from "effect/Either"
import type * as Types from "effect/Types"

import type * as Api from "./Api.js"
import * as internal from "./internal/route.js"
import type * as utils from "./internal/utils.js"
import type * as RouterBuilder from "./RouterBuilder.js"
import type * as SecurityScheme from "./SecurityScheme.js"
import type * as ServerError from "./ServerError.js"

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerFunction<Endpoint extends Api.Endpoint, R, E> = (
  input: Types.Simplify<EndpointSchemasTo<Endpoint["schemas"]>["request"]>,
  security: Types.Simplify<EndpointSecurityTo<Endpoint["options"]["security"]>>
) => Effect.Effect<
  EndpointResponseSchemaTo<Endpoint["schemas"]["response"]>,
  E,
  R
>

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromEndpoint: <Endpoint extends Api.Endpoint, R, E>(
  fn: HandlerFunction<Endpoint, R, E>,
  options?: RouterBuilder.Options
) => (
  endpoint: Endpoint
) => Router.Route<R, Exclude<E, ServerError.ServerError>> = internal.fromEndpoint

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <
  A extends Api.Api,
  Id extends A["groups"][number]["endpoints"][number]["id"],
  R,
  E
>(
  id: Id,
  fn: HandlerFunction<Extract<A["groups"][number]["endpoints"][number], { id: Id }>, R, E>,
  options?: RouterBuilder.Options
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>> = internal.make

/** @ignore */
type EndpointResponseSchemaTo<S> = S extends Api.IgnoredSchemaId ? void :
  S extends Schema.Schema<any, any> ? utils.SchemaTo<S>
  : S extends ReadonlyArray<Api.ResponseSchemaFull> ? ResponseSchemaFullTo<S[number]>
  : S extends Api.ResponseSchemaFull ? ResponseSchemaFullTo<S>
  : never

/** @ignore */
export type ResponseSchemaFullTo<S extends Api.ResponseSchemaFull> = S extends any ? Types.Simplify<
    & {
      status: S["status"]
    }
    & {
      [
        K in Exclude<
          RequiredFields<S>,
          "status" | "representations"
        >
      ]: S[K] extends Schema.Schema<any, any> ? utils.SchemaTo<S[K]> : never
    }
  >
  : never

/** @ignore */
type RequiredFields<E> = {
  [K in keyof E]: E[K] extends Api.IgnoredSchemaId ? never : K
}[keyof E]

/** @ignore */
export type EndpointSchemasTo<E extends Api.Endpoint["schemas"]> = Types.Simplify<{
  response: EndpointResponseSchemaTo<E["response"]>
  request: {
    [
      K in Extract<
        keyof E["request"],
        RequiredFields<E["request"]>
      >
    ]: utils.SchemaTo<E["request"][K]>
  }
}>

/** @ignore */
export type EndpointSecurityTo<Security extends Api.Endpoint["options"]["security"]> = Types.Simplify<
  {
    [K in keyof Security]: Security[K] extends infer SS extends SecurityScheme.HTTPSecurityScheme<any> ? {
        token: [IsUnion<keyof Security>] extends [true]
          ? Either.Either<Schema.Schema.To<SS["schema"]>, ParseResult.ParseError>
          : Schema.Schema.To<SS["schema"]>
        securityScheme: SS
      } :
      never
  }
>

/** @ignore */
type IsUnion<CheckUnion, Union = CheckUnion> = CheckUnion extends infer CheckUnionMember
  ? [Union] extends [CheckUnionMember] ? false : true
  : true
