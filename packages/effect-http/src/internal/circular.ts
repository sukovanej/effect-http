import * as Schema from "effect/Schema"

import type * as OpenApiTypes from "../OpenApiTypes.js"

/** @internal */
export const OpenApiId = Symbol.for("effect-http/OpenApi")

/** @internal */
export const annotate = (
  annotation: (
    compiler: (schema: Schema.Schema.Any) => OpenApiTypes.OpenAPISchemaType
  ) => OpenApiTypes.OpenAPISchemaType
) =>
<S extends Schema.Annotable.All>(self: S): Schema.Annotable.Self<S> =>
  Schema.annotations(self, { [OpenApiId]: annotation })
