import * as Schema from "@effect/schema/Schema"
import * as Predicate from "effect/Predicate"

import type * as ApiSchema from "../ApiSchema.js"
import * as circular from "./circular.js"

/** @internal */
export const IgnoredId: ApiSchema.IgnoredId = Symbol.for(
  "effect-http/ignored-id"
) as ApiSchema.IgnoredId

/** @internal */
export const Ignored: ApiSchema.Ignored = { [IgnoredId]: IgnoredId }

/** @internal */
export const formDataSchema = Schema.instanceOf(FormData, {
  description: "Multipart form data"
}).pipe(circular.annotate({}))

/** @internal */
export const isIgnored = (u: unknown): u is ApiSchema.Ignored =>
  Predicate.hasProperty(u, IgnoredId) && u[IgnoredId] === IgnoredId
