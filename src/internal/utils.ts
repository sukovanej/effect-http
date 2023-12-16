import type * as Method from "@effect/platform/Http/Method";
import * as Schema from "@effect/schema/Schema";
import * as Api from "effect-http/Api";

/** @internal */
export const getSchema = <A = Schema.Schema<any>>(
  input: Schema.Schema<any> | Api.IgnoredSchemaId,
  defaultSchema: Schema.Schema<any> | A = Schema.unknown,
) => (input == Api.IgnoredSchemaId ? defaultSchema : input);

/** @internal */
export const isArray = (input: unknown): input is readonly any[] =>
  Array.isArray(input);

export type SchemaTo<S> = S extends Schema.Schema<any, infer A> ? A : never;

/** @internal */
export const createResponseSchema = (
  responseSchema: Api.Endpoint["schemas"]["response"],
) => {
  if (Schema.isSchema(responseSchema)) {
    return responseSchema;
  }

  return Schema.union(
    ...(isArray(responseSchema) ? responseSchema : [responseSchema]).map(
      ({ status, content, headers }) =>
        Schema.struct({
          status: Schema.literal(status),
          content: getSchema(content),
          headers: getSchema(
            headers,
            Schema.record(Schema.string, Schema.string),
          ),
        }),
    ),
  );
};

/** @internal */
export const getSchemaPropertySignatures = (schema: Schema.Schema<any>) => {
  let ast = schema.ast;

  if (ast._tag === "Transform") {
    ast = ast.from;
  }

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Response headers must be a type literal schema`);
  }

  return ast.propertySignatures;
};

/** @internal */
export const convertMethod = (method: Api.Method): Method.Method =>
  method.toUpperCase() as Method.Method;
