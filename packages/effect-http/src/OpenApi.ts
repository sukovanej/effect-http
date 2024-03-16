/**
 * Derivation of `OpenApi` schema from an instance of `Api`.
 *
 * @since 1.0.0
 */
import type { OpenApiTypes } from "schema-openapi"

import type * as Api from "./Api.js"
import * as internal from "./internal/open-api.js"

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: (
  api: Api.Api.Any
) => OpenApiTypes.OpenAPISpec<OpenApiTypes.OpenAPISchemaType> = internal.make
