import * as Schema from "@effect/schema/Schema"
import type * as Api from "./Api.js"

const BearerLiteral = "Bearer" as const
type BearerLiteral = typeof BearerLiteral
const isBearerLiteral = (x: string): x is BearerLiteral => x === BearerLiteral

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
      scheme: BearerLiteral.toLowerCase()
    }
  }) satisfies Api.SecurityScheme

const BasicLiteral = "Basic" as const
type BasicLiteral = typeof BasicLiteral
const isBasicLiteral = (x: string): x is BasicLiteral => x === BasicLiteral

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
      scheme: BasicLiteral.toLowerCase()
    }
  }) satisfies Api.SecurityScheme
