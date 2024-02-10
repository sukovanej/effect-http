import { OpenApi } from "schema-openapi"
import type * as OpenApiTypes from "schema-openapi/OpenApiTypes"

import * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import { absurd, identity, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as ReadonlyRecord from "effect/ReadonlyRecord"
import * as Api from "../Api.js"

export const make = (
  api: Api.Api
): OpenApiTypes.OpenAPISpec<OpenApiTypes.OpenAPISchemaType> => {
  const apiSetters: Array<any> = []
  const pathSpecs = api.groups.flatMap((g) =>
    g.endpoints.map(
      ({ id, method, options, path, schemas, security }) => {
        const operationSpec = []

        const responseSchema = schemas.response

        if (Schema.isSchema(responseSchema)) {
          operationSpec.push(
            OpenApi.jsonResponse(
              200,
              responseSchema,
              "Response",
              descriptionSetter(responseSchema)
            )
          )
        } else {
          ;(Array.isArray(responseSchema) ? responseSchema : [responseSchema]).map(
            ({ content, headers, status }) => {
              const schema = content === Api.IgnoredSchemaId ? undefined : content
              const setHeaders = headers === Api.IgnoredSchemaId
                ? identity
                : OpenApi.responseHeaders(
                  createResponseHeadersSchemaMap(headers)
                )

              operationSpec.push(
                OpenApi.jsonResponse(
                  status as OpenApiTypes.OpenAPISpecStatusCode,
                  schema,
                  `Response ${status}`,
                  schema ? descriptionSetter(schema) : identity,
                  setHeaders
                )
              )
            }
          )
        }

        const { body, headers, params, query } = schemas.request

        if (params !== Api.IgnoredSchemaId) {
          operationSpec.push(...createParameterSetters("path", params))
        }

        if (query !== Api.IgnoredSchemaId) {
          operationSpec.push(...createParameterSetters("query", query))
        }

        if (headers !== Api.IgnoredSchemaId) {
          operationSpec.push(...createParameterSetters("header", headers))
        }

        if (body !== Api.IgnoredSchemaId) {
          operationSpec.push(OpenApi.jsonRequest(body, descriptionSetter(body)))
        }

        const securityResult = pipe(
          security,
          ReadonlyArray.fromRecord,
          ReadonlyArray.reduce(
            {
              operationSetters: [] as Array<any>,
              apiSetters: [] as Array<any>
            },
            (result, [name, securityScheme]) => {
              if (securityScheme.type === "http") {
                result.operationSetters.push(OpenApi.securityRequirement(name))
                result.apiSetters.push(OpenApi.securityScheme(name, {
                  type: securityScheme.type,
                  scheme: securityScheme.scheme.scheme,
                  ...(securityScheme.scheme.description === undefined ? {} : {
                    description: securityScheme.scheme.description
                  }),
                  ...((securityScheme.scheme.scheme.toLowerCase() === "bearer")
                    ? { bearerFormat: securityScheme.scheme.bearerFormat }
                    : {})
                }))

                return result
              }

              return absurd<never>(securityScheme.type)
            }
          )
        )
        operationSpec.push(...securityResult.operationSetters)
        apiSetters.push(...securityResult.apiSetters)

        if (options.description !== undefined) {
          operationSpec.push(OpenApi.description(options.description))
        }

        if (options.summary !== undefined) {
          operationSpec.push(OpenApi.summary(options.summary))
        }

        if (options.deprecated) {
          operationSpec.push(OpenApi.deprecated)
        }

        return OpenApi.path(
          createPath(path),
          OpenApi.operation(
            method,
            OpenApi.operationId(id),
            OpenApi.tags(g.options.name),
            ...operationSpec
          )
        )
      }
    )
  )

  if (ReadonlyArray.isNonEmptyArray(api.groups)) {
    const [firstGlobalTag, ...restGlobalTags] = ReadonlyArray.map(api.groups, (x) => x.options)

    pathSpecs.push(OpenApi.globalTags(firstGlobalTag, ...restGlobalTags))
  }

  if (api.options.servers) {
    pathSpecs.push(
      ...api.options.servers.map((server) =>
        typeof server === "string"
          ? OpenApi.server(server)
          : OpenApi.server(
            server.url,
            (_s) => ({ ..._s, ...server })
          )
      )
    )
  }

  const openApi = OpenApi.openAPI(
    api.options.title,
    api.options.version,
    ...apiSetters,
    ...pathSpecs
  )

  if (api.options.description) {
    openApi.info.description = api.options.description
  }

  if (api.options.license) {
    openApi.info.license = api.options.license
  }

  return openApi
}

/**
 * Convert path pattern to OpenApi syntax. Replaces :param by {param}.
 */
const createPath = (path: string) =>
  path
    .replace(/:(\w+)(\/)/g, "{$1}$2")
    .replace(/:(\w+)[?]/g, "{$1}")
    .replace(/:(\w+)$/g, "{$1}")

const descriptionSetter = <A extends { description?: string }>(
  schema: Schema.Schema<any, any, any>
) =>
  pipe(
    schema.ast,
    AST.getDescriptionAnnotation,
    Option.match({
      onNone: () => identity<A>,
      onSome: OpenApi.description
    })
  )

const getPropertySignatures = (
  openApiType: "query" | "header" | "path",
  ast: AST.AST
): ReadonlyArray<AST.PropertySignature> => {
  if (ast._tag === "Transform") {
    return getPropertySignatures(openApiType, ast.from)
  }

  if (ast._tag === "TypeLiteral") {
    return ast.propertySignatures
  }

  if (ast._tag === "Union") {
    const requiredPropertyNamesInUnions = pipe(
      ast.types,
      ReadonlyArray.map((type) =>
        getPropertySignatures(openApiType, type).filter((ps) => !ps.isOptional).map((ps) => ps.name)
      )
    )

    return pipe(
      ast.types,
      ReadonlyArray.flatMap((type) => getPropertySignatures(openApiType, type)),
      ReadonlyArray.groupBy((ps) => String(ps.name)),
      ReadonlyRecord.toEntries,
      ReadonlyArray.map(([_, ps]) => {
        const [first, ...rest] = ps
        return AST.createPropertySignature(
          first.name,
          AST.createUnion(ps.map((ps) => ps.type)),
          !requiredPropertyNamesInUnions.every((names) => names.includes(first.name)),
          rest.reduce((acc, cur) => acc || cur.isReadonly, first.isReadonly),
          first.annotations
        )
      })
    )
  }

  throw new Error(
    `${ast._tag} is not supported for ${openApiType} parameter.`
  )
}

const createParameterSetters = (
  type: "query" | "header" | "path",
  schema: Schema.Schema<any, any, any>
) => {
  return getPropertySignatures(type, schema.ast).map((ps) => {
    if (typeof ps.name !== "string") {
      throw new Error(`${type} parameter struct fields must be strings`)
    }

    const schema = Schema.make<unknown, unknown, never>(ps.type)

    return OpenApi.parameter(
      ps.name,
      type,
      schema,
      descriptionSetter(schema),
      ps.isOptional ? identity : OpenApi.required
    )
  })
}

const createResponseHeadersSchemaMap = (schema: Schema.Schema<any, any>) => {
  let ast = schema.ast

  if (ast._tag === "Transform") {
    ast = ast.from
  }

  if (ast._tag !== "TypeLiteral") {
    throw new Error(`Response headers must be a type literal schema`)
  }

  return Object.fromEntries(
    ast.propertySignatures.map((ps) => [
      ps.name,
      Schema.make<unknown, string, never>(ps.type)
    ])
  )
}
