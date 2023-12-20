import * as SchemaOpenApi from "schema-openapi";

import * as AST from "@effect/schema/AST";
import * as Schema from "@effect/schema/Schema";
import * as Api from "../Api.js";
import * as utils from "./utils.js";
import { identity, pipe } from "effect/Function";
import * as Option from "effect/Option";

export const make = (
  api: Api.Api,
): SchemaOpenApi.OpenAPISpec<SchemaOpenApi.OpenAPISchemaType> => {
  const pathSpecs = api.endpoints.map(
    ({ path, method, schemas, id, groupName, description }) => {
      const operationSpec = [];

      const responseSchema = schemas.response;

      if (Schema.isSchema(responseSchema)) {
        operationSpec.push(
          SchemaOpenApi.jsonResponse(
            200,
            responseSchema,
            "Response",
            descriptionSetter(responseSchema),
          ),
        );
      } else {
        (utils.isArray(responseSchema) ? responseSchema : [responseSchema]).map(
          ({ status, content, headers }) => {
            const schema =
              content === Api.IgnoredSchemaId ? undefined : content;
            const setHeaders =
              headers === Api.IgnoredSchemaId
                ? identity
                : SchemaOpenApi.responseHeaders(
                    createResponseHeadersSchemaMap(headers),
                  );

            operationSpec.push(
              SchemaOpenApi.jsonResponse(
                status as SchemaOpenApi.OpenAPISpecStatusCode,
                schema,
                `Response ${status}`,
                schema ? descriptionSetter(schema) : identity,
                setHeaders,
              ),
            );
          },
        );
      }

      const { params, query, body, headers } = schemas.request;

      if (params !== Api.IgnoredSchemaId) {
        operationSpec.push(...createParameterSetters("path", params));
      }

      if (query !== Api.IgnoredSchemaId) {
        operationSpec.push(...createParameterSetters("query", query));
      }

      if (headers !== Api.IgnoredSchemaId) {
        operationSpec.push(...createParameterSetters("header", headers));
      }

      if (body !== Api.IgnoredSchemaId) {
        operationSpec.push(SchemaOpenApi.jsonRequest(body, descriptionSetter(body)));
      }

      if (description) {
        operationSpec.push(SchemaOpenApi.description(description));
      }

      return SchemaOpenApi.path(
        createPath(path),
        SchemaOpenApi.operation(
          method,
          SchemaOpenApi.operationId(id),
          SchemaOpenApi.tags(groupName),
          ...operationSpec,
        ),
      );
    },
  );

  const openApi = SchemaOpenApi.openAPI(
    api.options.title,
    api.options.version,
    ...pathSpecs,
  );

  if (api.options.description) {
    openApi.info.description = api.options.description;
  }

  if (api.options.license) {
    openApi.info.license = api.options.license;
  }

  return openApi;
};

/**
 * Convert path pattern to OpenApi syntax. Replaces :param by {param}.
 */
const createPath = (path: string) =>
  path
    .replace(/:(\w+)(\/)/g, "{$1}$2")
    .replace(/:(\w+)[?]/g, "{$1}")
    .replace(/:(\w+)$/g, "{$1}");

const descriptionSetter = <A extends { description?: string }>(
  schema: Schema.Schema<any, any>,
) =>
  pipe(
    schema.ast,
    AST.getAnnotation<AST.DescriptionAnnotation>(AST.DescriptionAnnotationId),
    Option.match({ onNone: () => identity<A>, onSome: SchemaOpenApi.description }),
  );

const createParameterSetters = (
  type: "query" | "header" | "path",
  schema: Schema.Schema<any>,
) => {
  let ast = schema.ast;

  if (ast._tag === "Transform") {
    ast = ast.from;
  }

  if (ast._tag !== "TypeLiteral") {
    throw new Error(
      `${type} parameter must be a type literal schema, found ${ast._tag}`,
    );
  }

  return ast.propertySignatures.map((ps) => {
    if (typeof ps.name !== "string") {
      throw new Error(`${type} parameter struct fields must be strings`);
    }

    const schema = Schema.make(ps.type);

    return SchemaOpenApi.parameter(
      ps.name,
      type,
      schema,
      descriptionSetter(schema),
      ps.isOptional ? identity : SchemaOpenApi.required,
    );
  });
};

const createResponseHeadersSchemaMap = (schema: Schema.Schema<any>) => {
  let ast = schema.ast;

  if (ast._tag === "Transform") {
    ast = ast.from;
  }

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

