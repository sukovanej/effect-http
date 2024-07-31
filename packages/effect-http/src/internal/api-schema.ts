import * as Schema from "@effect/schema/Schema"
import * as Predicate from "effect/Predicate"

import { Multipart } from "@effect/platform"
import type * as ApiSchema from "../ApiSchema.js"
import * as circular from "./circular.js"

/** @internal */
export const IgnoredId: ApiSchema.IgnoredId = Symbol.for(
  "effect-http/ignored-id"
) as ApiSchema.IgnoredId

/** @internal */
export const Ignored: ApiSchema.Ignored = { [IgnoredId]: IgnoredId }

/** @internal */
export const formDataSchema = Schema.instanceOf(FormData).pipe(
  circular.annotate(() => ({
    type: "string",
    format: "binary",
    description: "Multipart form data"
  }))
)

/** @internal */
export const persistedSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Multipart.FilesSchema)
}).pipe(
  circular.annotate(() => ({
    type: "string",
    format: "binary",
    description: "Multipart form data"
  }))
)

/** @internal */
export const isIgnored = (u: unknown): u is ApiSchema.Ignored =>
  Predicate.hasProperty(u, IgnoredId) && u[IgnoredId] === IgnoredId
