/**
 * Derivation of `OpenApi` schema from an instance of `Api`.
 *
 * @since 1.0.0
 */
import * as OpenApi from "schema-openapi";

import { AST, Schema } from "@effect/schema";
import { Option, identity, pipe } from "effect";
import * as Api from "effect-http/Api";
import { isArray } from "effect-http/internal/utils";

/**
 * Generate OpenApi specification for the Api.
 *
 * @category constructors
 * @since 1.0.0
 */
export const openApi = (
  api: Api.Api,
): OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType> => {
  return api.endpoints.reduce(
    (spec, { path, method, schemas, id, groupName, description }) => {
      const operationSpec = [];

      const responseSchema = schemas.response;

      if (Schema.isSchema(responseSchema)) {
        operationSpec.push(
          OpenApi.jsonResponse(
            200,
            responseSchema,
            "Response",
            descriptionSetter(responseSchema),
          ),
        );
      } else {
        (isArray(responseSchema) ? responseSchema : [responseSchema]).map(
          ({ status, content, headers }) => {
            const schema =
              content === Api.IgnoredSchemaId ? undefined : content;
            const setHeaders =
              headers === Api.IgnoredSchemaId
                ? identity
                : OpenApi.responseHeaders(
                    createResponseHeadersSchemaMap(headers),
                  );

            operationSpec.push(
              OpenApi.jsonResponse(
                status as OpenApi.OpenAPISpecStatusCode,
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
        operationSpec.push(OpenApi.jsonRequest(body, descriptionSetter(body)));
      }

      if (description) {
        operationSpec.push(OpenApi.description(description));
      }

      return OpenApi.path(
        createPath(path),
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
    Option.match({ onNone: () => identity<A>, onSome: OpenApi.description }),
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

    return OpenApi.parameter(
      ps.name,
      type,
      schema,
      descriptionSetter(schema),
      ps.isOptional ? identity : OpenApi.required,
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
