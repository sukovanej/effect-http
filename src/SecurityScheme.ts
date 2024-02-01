/**
 * A security scheme is a way to protect an API from unauthorized access.
 * @since 1.0.0
 */
import * as Schema from "@effect/schema/Schema"
import * as S from "effect/String"
import type * as OpenApi from "schema-openapi/types"

/**
 * @category models
 * @since 1.0.0
 */
export type SecurityScheme = {
  type: OpenApi.OpenAPIHTTPSecurityScheme["type"]
  scheme: Omit<OpenApi.OpenAPIHTTPSecurityScheme, "type">
  decodeSchema: Schema.Schema<any, string, any>
}

/**
 * @category constants
 * @since 1.0.0
 */
const BearerLiteral = "Bearer" as const

/**
 * @category models
 * @since 1.0.0
 */
type BearerLiteral = typeof BearerLiteral

/**
 * @category refinements
 * @since 1.0.0
 */
const isBearerLiteral = (x: string): x is BearerLiteral => x === BearerLiteral

/**
 * Creates bearer http security scheme auth description
 *
 * @category constructors
 * @since 1.0.0
 */
export const bearer = <A>(args: {
  description?: string
  bearerFormat?: string
  tokenScheme: Schema.Schema<never, string, A>
}) =>
  ({
    type: "http",
    decodeSchema: Schema.split(" ").pipe(
      Schema.filter(
        (x): x is readonly [BearerLiteral, string] => x.length === 2 && isBearerLiteral(x[0])
      ),
      Schema.transform( //
        args.tokenScheme,
        ([_, token]) => token,
        (token) => [BearerLiteral, token] as const
      )
    ),
    scheme: {
      ...((args.description !== undefined) ? { description: args.description } : {}),
      ...((args.bearerFormat !== undefined) ? { bearerFormat: args.bearerFormat } : {}),
      scheme: S.toLowerCase(BearerLiteral)
    }
  }) satisfies SecurityScheme

/**
 * @category constants
 * @since 1.0.0
 */
const BasicLiteral = "Basic" as const

/**
 * @category models
 * @since 1.0.0
 */
type BasicLiteral = typeof BasicLiteral

/**
 * @category refinements
 * @since 1.0.0
 */
const isBasicLiteral = (x: string): x is BasicLiteral => x === BasicLiteral

/**
 * Creates basic http security scheme auth description
 *
 * @category constructors
 * @since 1.0.0
 */
export const basic = <A>(args: {
  description?: string
  tokenScheme: Schema.Schema<never, string, A>
}) =>
  ({
    type: "http",
    decodeSchema: Schema.split(" ").pipe(
      Schema.filter(
        (x): x is readonly [BasicLiteral, string] => x.length === 2 && isBasicLiteral(x[0])
      ),
      Schema.transform(
        args.tokenScheme,
        ([_, token]) => token,
        (token) => [BasicLiteral, token] as const
      )
    ),
    scheme: {
      ...((args.description !== undefined) ? { description: args.description } : {}),
      scheme: S.toLowerCase(BasicLiteral)
    }
  }) satisfies SecurityScheme
