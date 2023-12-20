/**
 * Derivation of `OpenApi` schema from an instance of `Api`.
 *
 * @since 1.0.0
 */
import type * as OpenApi from "schema-openapi"

import type * as Api from "./Api.js"
import * as internal from "./internal/open-api.js"

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: (
  api: Api.Api
) => OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType> = internal.make
