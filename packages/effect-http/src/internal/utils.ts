import type * as Method from "@effect/platform/Http/Method"
import * as Schema from "@effect/schema/Schema"
import type * as Api from "../Api.js"
import { IgnoredSchemaId } from "./api.js"

/** @internal */
export const getSchema = <A = Schema.Schema<any, any>>(
  input: Schema.Schema<any, any> | Api.IgnoredSchemaId,
  defaultSchema: Schema.Schema<any, any> | A = Schema.unknown
) => (input == IgnoredSchemaId ? defaultSchema : input)

/** @internal */
export const createResponseSchema = (
  responseSchema: Api.Endpoint["schemas"]["response"]
) => {
  if (Schema.isSchema(responseSchema)) {
    return responseSchema
  }

  return Schema.union(
    ...(Array.isArray(responseSchema) ? responseSchema : [responseSchema]).map(
      ({ content, headers, status }) =>
        Schema.struct({
          status: Schema.literal(status),
          content: getSchema(content),
          headers: getSchema(
            headers,
            Schema.record(Schema.string, Schema.string)
          )
        })
    )
  )
}

export type SchemaTo<S> = S extends Schema.Schema<infer A, any, any> ? A : never

/** @internal */
export const convertMethod = (method: Api.Method): Method.Method => method.toUpperCase() as Method.Method
