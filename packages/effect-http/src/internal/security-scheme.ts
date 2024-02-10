import * as Schema from "@effect/schema/Schema"
import * as S from "effect/String"
import type * as SS from "../SecurityScheme.js"

export const BearerLiteral: SS.BearerLiteral = "Bearer" as const

export const isBearerLiteral = (u: unknown): u is SS.BearerLiteral => u === BearerLiteral

export const bearer: typeof SS.bearer = <A>(args: {
  description?: string
  bearerFormat?: string
  tokenSchema: Schema.Schema<A, string>
}) => ({
  type: "http",
  schema: Schema.split(" ").pipe(
    Schema.filter(
      (x): x is readonly [SS.BearerLiteral, string] => x.length === 2 && isBearerLiteral(x[0])
    ),
    Schema.transform(
      args.tokenSchema,
      ([_, token]) => token,
      (token) => [BearerLiteral, token] as const
    )
  ),
  options: {
    ...((args.description !== undefined) ? { description: args.description } : {}),
    ...((args.bearerFormat !== undefined) ? { bearerFormat: args.bearerFormat } : {}),
    scheme: S.toLowerCase(BearerLiteral)
  }
})

export const BasicLiteral: SS.BasicLiteral = "Basic" as const

export const isBasicLiteral = (u: unknown): u is SS.BasicLiteral => u === BasicLiteral

export const basic: typeof SS.basic = <A>(args: {
  tokenSchema: Schema.Schema<A, string>
  description?: string
}) =>
  ({
    type: "http",
    schema: Schema.split(" ").pipe(
      Schema.filter(
        (x): x is readonly [SS.BasicLiteral, string] => x.length === 2 && isBasicLiteral(x[0])
      ),
      Schema.transform(
        args.tokenSchema,
        ([_, token]) => token,
        (token) => [BasicLiteral, token] as const
      )
    ),
    options: {
      ...((args.description !== undefined) ? { description: args.description } : {}),
      scheme: S.toLowerCase(BasicLiteral)
    }
  }) satisfies SS.SecurityScheme<A>
