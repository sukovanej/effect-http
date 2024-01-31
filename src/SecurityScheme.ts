import * as Schema from "@effect/schema/Schema"
import * as S from "effect/String"
import type * as Api from "./Api.js"

const BearerLiteral = "Bearer" as const
type BearerLiteral = typeof BearerLiteral
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
  }) satisfies Api.SecurityScheme

const BasicLiteral = "Basic" as const
type BasicLiteral = typeof BasicLiteral
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
  }) satisfies Api.SecurityScheme
