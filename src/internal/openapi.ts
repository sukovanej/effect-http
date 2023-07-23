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
              : OpenApi.responseHeaders(
                  createResponseHeadersSchemaMap(headers),
                );

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

      const { params, query, body, headers } = schemas.request;

      if (params !== IgnoredSchemaId) {
        operationSpec.push(...createParameterSetters("path", params));
      }

      if (query !== IgnoredSchemaId) {
        operationSpec.push(...createParameterSetters("query", query));
      }

      if (headers !== IgnoredSchemaId) {
        operationSpec.push(...createParameterSetters("header", headers));
      }

      if (body !== IgnoredSchemaId) {
        operationSpec.push(OpenApi.jsonRequest(body, descriptionSetter(body)));
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

const createParameterSetters = (
  type: "query" | "header" | "path",
  schema: Schema.Schema<any>,
) => {
  const ast = schema.ast;

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`${type} parameter must be a type literal schema`);
  }

  return ast.propertySignatures.map((ps) => {
    if (typeof ps.name !== "string") {
      throw new Error(`${type} parameter struct fields must be strings`);
    }

    const schema = Schema.make(ps.type);

    return OpenApi.parameter(
      ps.name,
      "header",
      schema,
      descriptionSetter(schema),
      ps.isOptional ? identity : OpenApi.required,
    );
  });
};

const createResponseHeadersSchemaMap = (schema: Schema.Schema<any>) => {
  const ast = schema.ast;

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Response headers must be a type literal schema`);
  }

  return Object.fromEntries(
    ast.propertySignatures.map((ps) => [
      ps.name,
      Schema.make<string, unknown>(ps.type),
    ]),
  );
};
