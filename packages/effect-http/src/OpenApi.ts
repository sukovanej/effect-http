/**
 * Derivation of `OpenApi` schema from an instance of `Api`.
 *
 * @since 1.0.0
 */

import type * as Schema from "@effect/schema/Schema"

import type * as Api from "./Api.js"
import * as internal from "./internal/open-api.js"
import type * as OpenApiTypes from "./OpenApiTypes.js"

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: (api: Api.Api.Any) => OpenApiTypes.OpenAPISpec = internal.make

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const makeSchema: (api: Schema.Schema.AnyNoContext) => OpenApiTypes.OpenAPISchemaType = internal.makeSchema

/**
 * Set up an OpenAPI for the given schema.
 *
 * @category combining
 * @since 1.0.0
 */
export const annotate: (
  annotation: (
    compiler: (schema: Schema.Schema.Any) => OpenApiTypes.OpenAPISchemaType
  ) => OpenApiTypes.OpenAPISchemaType
) => <S extends Schema.Annotable.All>(self: S) => Schema.Annotable.Self<S> = internal.annotate
