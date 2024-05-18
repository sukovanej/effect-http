import { OpenApi } from "schema-openapi"
import type * as OpenApiTypes from "schema-openapi/OpenApiTypes"

import * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as Security from "effect-http-security/Security"
import * as Array from "effect/Array"
import { identity, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Record from "effect/Record"
import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiResponse from "../ApiResponse.js"
import * as ApiSchema from "../ApiSchema.js"

export const make = (
  api: Api.Api.Any
): OpenApiTypes.OpenAPISpec<OpenApiTypes.OpenAPISchemaType> => {
  const apiSetters: Array<any> = []
  const pathSpecs = api.groups.flatMap((group) =>
    group.endpoints.map(
      (endpoint) => {
        const options = ApiEndpoint.getOptions(endpoint)
        const security = ApiEndpoint.getSecurity(endpoint)
        const operationSpec = []

        for (const response of ApiEndpoint.getResponse(endpoint)) {
          const body = ApiResponse.getBodySchema(response)
          const headers = ApiResponse.getHeadersSchema(response)
          const status = ApiResponse.getStatus(response)

          if (ApiSchema.isIgnored(body) && ApiSchema.isIgnored(headers)) {
            operationSpec.push(OpenApi.noContentResponse("No response", status))
            continue
          }

          const bodySchema = ApiSchema.isIgnored(body) ? undefined : body
          const setHeaders = ApiSchema.isIgnored(headers) ? identity : createResponseHeaderSetter(headers)

          operationSpec.push(
            OpenApi.jsonResponse(
              status as OpenApiTypes.OpenAPISpecStatusCode,
              bodySchema,
              `Response ${status}`,
              bodySchema ? descriptionSetter(bodySchema) : identity,
              setHeaders
            )
          )
        }

        const request = ApiEndpoint.getRequest(endpoint)

        const body = ApiRequest.getBodySchema(request)
        const headers = ApiRequest.getHeadersSchema(request)
        const path = ApiRequest.getPathSchema(request)
        const query = ApiRequest.getQuerySchema(request)

        if (!ApiSchema.isIgnored(path)) {
          operationSpec.push(...createParameterSetters("path", path))
        }

        if (!ApiSchema.isIgnored(query)) {
          operationSpec.push(...createParameterSetters("query", query))
        }

        if (!ApiSchema.isIgnored(headers)) {
          operationSpec.push(...createParameterSetters("header", headers))
        }

        if (!ApiSchema.isIgnored(body)) {
          operationSpec.push(OpenApi.jsonRequest(body, OpenApi.required, descriptionSetter(body)))
        }

        const securityResult = pipe(
          security,
          Security.getOpenApi,
          Record.toEntries,
          Array.reduce(
            {
              operationSetters: [] as Array<any>,
              apiSetters: [] as Array<any>
            },
            (result, [name, openapi]) => {
              result.operationSetters.push(OpenApi.securityRequirement(name))
              result.apiSetters.push(OpenApi.securityScheme(name, openapi as OpenApiTypes.OpenAPISecurityScheme))
              return result
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
          createPath(ApiEndpoint.getPath(endpoint)),
          OpenApi.operation(
            ApiEndpoint.getMethod(endpoint).toLowerCase() as OpenApiTypes.OpenAPISpecMethodName,
            OpenApi.operationId(ApiEndpoint.getId(endpoint)),
            OpenApi.tags(group.name),
            ...operationSpec
          )
        )
      }
    )
  )

  if (Array.isNonEmptyReadonlyArray(api.groups)) {
    const [firstGlobalTag, ...restGlobalTags] = Array.map(
      api.groups,
      (group) => ({ ...group.options, name: group.name })
    )

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
  if (ast._tag === "Transformation") {
    return getPropertySignatures(openApiType, ast.from)
  }

  if (ast._tag === "TypeLiteral") {
    return ast.propertySignatures
  }

  if (ast._tag === "Union") {
    const requiredPropertyNamesInUnions = pipe(
      ast.types,
      Array.map((type) => getPropertySignatures(openApiType, type).filter((ps) => !ps.isOptional).map((ps) => ps.name))
    )

    return pipe(
      ast.types,
      Array.flatMap((type) => getPropertySignatures(openApiType, type)),
      Array.groupBy((ps) => String(ps.name)),
      Record.toEntries,
      Array.map(([_, ps]) => {
        const [first, ...rest] = ps
        return new AST.PropertySignature(
          first.name,
          AST.Union.make(ps.map((ps) => ps.type)),
          !requiredPropertyNamesInUnions.every((names) => names.includes(first.name)),
          rest.reduce((acc, cur) => acc || cur.isReadonly, first.isReadonly),
          first.annotations
        )
      })
    )
  }

  throw new Error(
    `${ast._tag} is not supported for ${openApiType} parameter. ${ast}`
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

const createResponseHeaderSetter = (schema: Schema.Schema<any, any, unknown>) => {
  const ps = getPropertySignatures("header", schema.ast)

  return OpenApi.responseHeaders(
    Object.fromEntries(ps.map((ps) => [ps.name, Schema.make(ps.type)]))
  )
}
