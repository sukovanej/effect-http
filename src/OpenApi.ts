import type { Api } from "effect-http/Api";
import * as internal from "effect-http/internal/openapi";
import type * as OpenApi from "schema-openapi";

export type OpenApiSpecification =
  OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>;

/** Generate OpenApi specification for the Api. */
export const openApi: <A extends Api>(api: A) => OpenApiSpecification =
  internal.openApi;
