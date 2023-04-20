import type * as OpenApi from "schema-openapi";

import type { Api } from "./Api";
import * as internal from "./internal/openapi";

export type OpenApiSpecification =
  OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>;

/** Generate OpenApi specification for the Api. */
export const openApi: <A extends Api>(api: A) => OpenApiSpecification =
  internal.openApi;
