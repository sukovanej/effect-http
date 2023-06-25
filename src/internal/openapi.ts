import * as OpenApi from "schema-openapi";

import { identity, pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as AST from "@effect/schema/AST";
import * as Schema from "@effect/schema/Schema";

import type { Api } from "effect-http/Api";
import { IgnoredSchemaId } from "effect-http/Api";
import type { OpenApiSpecification } from "effect-http/OpenApi";

import { isArray } from "./utils";

export const openApi = (api: Api): OpenApiSpecification => {
  return api.endpoints.reduce(
    (spec, { path, method, schemas, id, groupName, description }) => {
      const operationSpec = [];

      if (isArray(schemas.response)) {
        schemas.response.map(({ status, content, headers }) => {
          const schema = content === IgnoredSchemaId ? undefined : content;
          const setHeaders =
            headers === IgnoredSchemaId
              ? identity
              : OpenApi.responseHeaders(headers);

          operationSpec.push(
            OpenApi.jsonResponse(
              status as OpenApi.OpenAPISpecStatusCode,
              schema,
              `Response ${status}`,
              (schema && descriptionSetter(schema)) || identity,
              setHeaders,
            ),
          );
        });
      } else {
        operationSpec.push(
          OpenApi.jsonResponse(
            200,
            schemas.response,
            "Response",
            descriptionSetter(schemas.response),
          ),
        );
      }

      if (schemas.params !== IgnoredSchemaId) {
        for (const [name, schema] of Object.entries(schemas.params)) {
          operationSpec.push(
            OpenApi.parameter(name, "path", schema, descriptionSetter(schema)),
          );
        }
      }

      if (schemas.query !== IgnoredSchemaId) {
        for (const [name, schema] of Object.entries(schemas.query)) {
          operationSpec.push(
            OpenApi.parameter(name, "query", schema, descriptionSetter(schema)),
          );
        }
      }

      if (schemas.body !== IgnoredSchemaId) {
        operationSpec.push(
          OpenApi.jsonRequest(schemas.body, descriptionSetter(schemas.body)),
        );
      }

      if (schemas.headers !== IgnoredSchemaId) {
        for (const [name, schema] of Object.entries(schemas.headers)) {
          operationSpec.push(
            OpenApi.parameter(
              name,
              "header",
              schema,
              descriptionSetter(schema),
            ),
          );
        }
      }

      if (description) {
        operationSpec.push(OpenApi.description(description));
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

const descriptionSetter = <A extends { description?: string }>(
  schema: Schema.Schema<any, any>,
) =>
  pipe(
    schema.ast,
    AST.getAnnotation<AST.DescriptionAnnotation>(AST.DescriptionAnnotationId),
    Option.match({ onNone: () => identity<A>, onSome: OpenApi.description }),
  );
