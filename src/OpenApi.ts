/**
 * @since 1.0.0
 */
import type * as OpenApi from "schema-openapi";

import type { Api } from "effect-http/Api";
import * as internal from "effect-http/internal/openapi";

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecification =
  OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>;

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const openApi: <A extends Api>(api: A) => OpenApiSpecification =
  internal.openApi;
