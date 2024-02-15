import * as Schema from "@effect/schema/Schema"
import * as S from "effect/String"
import type * as SecurityScheme from "../SecurityScheme.js"

export const BearerLiteral: SecurityScheme.BearerLiteral = "Bearer" as const

export const isBearerLiteral = (u: unknown): u is SecurityScheme.BearerLiteral => u === BearerLiteral

export const bearer: typeof SecurityScheme.bearer = <A>(args: {
  description?: string
  bearerFormat?: string
  tokenSchema: Schema.Schema<A, string>
}) => ({
  type: "http",
  schema: Schema.split(" ").pipe(
    Schema.filter(
      (x): x is readonly [SecurityScheme.BearerLiteral, string] => x.length === 2 && isBearerLiteral(x[0])
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

export const BasicLiteral: SecurityScheme.BasicLiteral = "Basic" as const

export const isBasicLiteral = (u: unknown): u is SecurityScheme.BasicLiteral => u === BasicLiteral

export const basic: typeof SecurityScheme.basic = <A>(args: {
  tokenSchema: Schema.Schema<A, string>
  description?: string
}) =>
  ({
    type: "http",
    schema: Schema.split(" ").pipe(
      Schema.filter(
        (x): x is readonly [SecurityScheme.BasicLiteral, string] => x.length === 2 && isBasicLiteral(x[0])
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
  }) satisfies SecurityScheme.SecurityScheme<A>
