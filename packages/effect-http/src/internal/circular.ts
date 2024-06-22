import * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"

import type * as OpenApiTypes from "../OpenApiTypes.js"

/** @internal */
export const OpenApiId = Symbol.for("effect-http/OpenApi")

/** @internal */
export const annotate =
  (spec: OpenApiTypes.OpenAPISchemaType) => <A, I, R>(self: Schema.Schema<A, I, R>): Schema.Schema<A, I, R> =>
    Schema.make(AST.annotations(self.ast, { [OpenApiId]: spec }))
