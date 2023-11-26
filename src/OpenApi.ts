/**
 * Derivation of `OpenApi` schema from an instance of `Api`.
 *
 * @since 1.0.0
 */
import type * as OpenApi from "schema-openapi";

import type * as Api from "effect-http/Api";
import * as internal from "effect-http/internal/open-api";

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: (
  api: Api.Api,
) => OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType> = internal.make;
