import * as OpenApi from "schema-openapi";

import type { Api } from "effect-http/Api";
import type { OpenApiSpecification } from "effect-http/OpenApi";
import { IgnoredSchemaId } from "effect-http/internal/api";

export const openApi = <A extends Api>(api: A): OpenApiSpecification => {
  return api.endpoints.reduce(
    (spec, { path, method, schemas, id, groupName }) => {
      const operationSpec = [];

      operationSpec.push(
        OpenApi.jsonResponse(200, schemas.response, "Response"),
      );

      if (schemas.params !== IgnoredSchemaId) {
        for (const [name, schema] of Object.entries(schemas.params)) {
          operationSpec.push(OpenApi.parameter(name, "path", schema as any));
        }
      }

      if (schemas.query !== IgnoredSchemaId) {
        for (const [name, schema] of Object.entries(schemas.query)) {
          operationSpec.push(OpenApi.parameter(name, "query", schema as any));
        }
      }

      if (schemas.body !== IgnoredSchemaId) {
        operationSpec.push(OpenApi.jsonRequest(schemas.body));
      }

      if (schemas.headers !== IgnoredSchemaId) {
        for (const [name, schema] of Object.entries(schemas.headers)) {
          operationSpec.push(OpenApi.parameter(name, "header", schema as any));
        }
      }

      return OpenApi.path(
        path,
        OpenApi.operation(
          method,
          OpenApi.operationId(id),
          OpenApi.tags(groupName),
          ...operationSpec,
        ),
      )(spec);
    },
    OpenApi.openAPI(api.options.title, api.options.version),
  );
};
