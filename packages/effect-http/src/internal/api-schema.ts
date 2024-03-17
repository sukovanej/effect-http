import * as Schema from "@effect/schema/Schema"
import * as OpenApiCompiler from "schema-openapi/OpenApiCompiler"
import type * as ApiSchema from "../ApiSchema.js"

export const IgnoredId: ApiSchema.IgnoredId = Symbol.for(
  "effect-http/ignored-id"
) as ApiSchema.IgnoredId

export const Ignored: ApiSchema.Ignored = { [IgnoredId]: IgnoredId }

export const formDataSchema = Schema.instanceOf(FormData, {
  description: "Multipart form data"
}).pipe(OpenApiCompiler.annotate({}))
