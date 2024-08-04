import * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as Array from "effect/Array"
import { identity, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Record from "effect/Record"

import type * as Api from "../Api.js"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiResponse from "../ApiResponse.js"
import * as ApiSchema from "../ApiSchema.js"
import type * as OpenApiTypes from "../OpenApiTypes.js"
import * as Security from "../Security.js"
import * as circular from "./circular.js"

/** @internal */
export const make = (
  api: Api.Api.Any
): OpenApiTypes.OpenAPISpec => {
  const componentSchemasFromReference: Array<[id: string, ast: AST.AST]> = []
  const addedComponentSchemas = new Set<string>()

  const addComponentSchemaCallback: ComponentSchemaCallback = (id, ast) => {
    if (!addedComponentSchemas.has(id)) {
      componentSchemasFromReference.push([id, ast] as const)
      addedComponentSchemas.add(id)
    }
  }

  const openApi: OpenApiTypes.OpenAPISpec = {
    openapi: "3.0.3",
    info: {
      title: api.options.title,
      version: api.options.version
    },
    paths: {}
  }

  api.groups.forEach((group) =>
    group.endpoints.forEach((endpoint) => {
      const options = ApiEndpoint.getOptions(endpoint)
      const security = ApiEndpoint.getSecurity(endpoint)

      const operationSpec: OpenApiTypes.OpenAPISpecOperation = {
        operationId: ApiEndpoint.getId(endpoint),
        tags: [group.name]
      }

      for (const response of ApiEndpoint.getResponse(endpoint)) {
        const body = ApiResponse.getBodySchema(response)
        const headers = ApiResponse.getHeadersSchema(response)
        const status = ApiResponse.getStatus(response)

        const responseSpec: OpenApiTypes.OpenApiSpecResponse = { description: `Response ${status}` }

        if (!ApiSchema.isIgnored(body) && !ApiSchema.isIgnored(headers)) {
          responseSpec.description = "No content"
        }

        if (!ApiSchema.isIgnored(body)) {
          const content: OpenApiTypes.OpenApiSpecMediaType = {
            schema: makeSchema(body, addComponentSchemaCallback)
          }

          const description = AST.getDescriptionAnnotation(body.ast)

          if (Option.isSome(description)) {
            content.description = description.value
          }

          responseSpec.content = {
            "application/json": content
          }
        }

        if (!ApiSchema.isIgnored(headers)) {
          responseSpec.headers = createResponseHeaders(headers, addComponentSchemaCallback)
        }

        operationSpec.responses = {
          ...operationSpec.responses,
          [String(status)]: responseSpec
        }
      }

      const addParameters = (
        type: "query" | "header" | "path",
        schema: Schema.Schema.Any
      ) => {
        let parameters: Array<OpenApiTypes.OpenAPISpecParameter> = []

        if (operationSpec.parameters === undefined) {
          operationSpec.parameters = parameters
        } else {
          parameters = operationSpec.parameters
        }

        parameters.push(...createParameters(type, schema, addComponentSchemaCallback))
      }

      const request = ApiEndpoint.getRequest(endpoint)

      const body = ApiRequest.getBodySchema(request)
      const headers = ApiRequest.getHeadersSchema(request)
      const path = ApiRequest.getPathSchema(request)
      const query = ApiRequest.getQuerySchema(request)

      if (!ApiSchema.isIgnored(path)) {
        addParameters("path", path)
      }

      if (!ApiSchema.isIgnored(query)) {
        addParameters("query", query)
      }

      if (!ApiSchema.isIgnored(headers)) {
        addParameters("header", headers)
      }

      if (!ApiSchema.isIgnored(body)) {
        operationSpec.requestBody = {
          content: {
            "application/json": {
              schema: makeSchema(body, addComponentSchemaCallback)
            }
          },
          required: true
        }

        const description = AST.getDescriptionAnnotation(body.ast)

        if (Option.isSome(description)) {
          operationSpec.requestBody.description = description.value
        }
      }

      const securityList = Record.toEntries(Security.getOpenApi(security))

      if (securityList.length > 0) {
        operationSpec.security = securityList.map(([name]) => ({ [name]: [] }))
      }

      for (const [name, schemes] of securityList) {
        const securitySchemes = openApi.components?.securitySchemes ?? {}
        securitySchemes[name] = schemes as OpenApiTypes.OpenAPISecurityScheme

        const components = openApi.components ?? {}
        components.securitySchemes = securitySchemes

        openApi.components = components
      }

      if (options.description !== undefined) {
        operationSpec.description = options.description
      }

      if (options.summary !== undefined) {
        operationSpec.summary = options.summary
      }

      if (options.deprecated) {
        operationSpec["deprecated"] = true
      }

      const pathName = createPath(ApiEndpoint.getPath(endpoint))

      openApi.paths = {
        ...openApi.paths,
        [pathName]: {
          ...openApi.paths[pathName],
          [ApiEndpoint.getMethod(endpoint).toLowerCase() as OpenApiTypes.OpenAPISpecMethodName]: operationSpec
        }
      }
    })
  )

  if (Array.isNonEmptyReadonlyArray(api.groups)) {
    openApi.tags = Array.map(
      api.groups,
      (group) => ({ ...group.options, name: group.name })
    )
  }

  if (api.options.servers) {
    openApi.servers = api.options.servers.map((server) => typeof server === "string" ? ({ url: server }) : server)
  }

  if (api.options.description) {
    openApi.info.description = api.options.description
  }

  if (api.options.license) {
    openApi.info.license = api.options.license
  }

  if (componentSchemasFromReference.length > 0) {
    const schemas: Record<string, OpenApiTypes.OpenAPISchemaType> = {}

    let reference: [string, AST.AST] | undefined

    while ((reference = componentSchemasFromReference.pop())) {
      const [name, ast] = reference
      schemas[name] = openAPISchemaForAst(removeIdentifierAnnotation(ast), addComponentSchemaCallback)
    }

    if (openApi.components === undefined) {
      openApi.components = { schemas }
    }

    openApi.components.schemas = schemas
  }

  return openApi
}

const removeAnnotation = (key: symbol) => (ast: AST.AST & AST.Annotated): AST.AST => {
  if (Object.prototype.hasOwnProperty.call(ast.annotations, key)) {
    // copied from the implementation of AST.annotations
    const { [key]: _, ...annotations } = ast.annotations
    const d = Object.getOwnPropertyDescriptors(ast)
    d.annotations.value = annotations
    return Object.create(Object.getPrototypeOf(ast), d)
  }
  return ast
}

const removeIdentifierAnnotation = removeAnnotation(
  AST.IdentifierAnnotationId
)

/**
 * Convert path pattern to OpenApi syntax. Replaces :param by {param}.
 * @internal
 */
const createPath = (path: string) =>
  path
    .replace(/:(\w+)(\/)/g, "{$1}$2")
    .replace(/:(\w+)[?]/g, "{$1}")
    .replace(/:(\w+)$/g, "{$1}")

/** @internal */
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

/** @internal */
const createParameters = (
  type: "query" | "header" | "path",
  schema: Schema.Schema<any, any, any>,
  componentSchemaCallback: ComponentSchemaCallback
): Array<OpenApiTypes.OpenAPISpecParameter> => {
  return getPropertySignatures(type, schema.ast).map((ps) => {
    if (typeof ps.name !== "string") {
      throw new Error(`${type} parameter struct fields must be strings`)
    }

    const ast = (ps.type._tag === "Union" && ps.type.types.some(AST.isUndefinedKeyword)) ?
      AST.Union.make(
        ps.type.types.filter((ast) => !AST.isUndefinedKeyword(ast)),
        ps.type.annotations
      ) :
      ps.type

    const schema = Schema.make<unknown, unknown, never>(ast)

    const parameter: OpenApiTypes.OpenAPISpecParameter = {
      name: ps.name,
      in: type,
      schema: makeSchema(schema, componentSchemaCallback)
    }

    if (!ps.isOptional) {
      parameter["required"] = true
    }

    const description = AST.getDescriptionAnnotation(schema.ast)
    if (Option.isSome(description)) {
      parameter["description"] = description.value
    }

    return parameter
  })
}

/** @internal */
const createResponseHeaders = (schema: Schema.Schema.Any, componentSchemaCallback: ComponentSchemaCallback) => {
  const ps = getPropertySignatures("header", schema.ast)

  return Object.fromEntries(ps.map((ps) => {
    const schema: OpenApiTypes.OpenApiSpecResponseHeader = {
      schema: makeSchema(Schema.make(ps.type), componentSchemaCallback)
    }
    const description = AST.getDescriptionAnnotation(ps.type)

    if (Option.isSome(description)) {
      schema.description = description.value
    }

    return [ps.name, schema]
  }))
}

/** @internal */
export const annotate = circular.annotate

/** @internal */
const getOpenApiAnnotation = (ast: AST.Annotated) =>
  AST.getAnnotation<
    (compile: (schema: Schema.Schema.Any) => OpenApiTypes.OpenAPISchemaType) => OpenApiTypes.OpenAPISchemaType
  >(circular.OpenApiId)(ast)

/** @internal */
const convertJsonSchemaAnnotation = (annotations: object) => {
  let newAnnotations = annotations

  if ("exclusiveMinimum" in newAnnotations) {
    const { exclusiveMinimum, ...rest } = newAnnotations
    newAnnotations = {
      ...rest,
      exclusiveMinimum: true,
      minimum: exclusiveMinimum
    }
  }

  if ("exclusiveMaximum" in newAnnotations) {
    const { exclusiveMaximum, ...rest } = newAnnotations
    newAnnotations = {
      ...rest,
      exclusiveMaximum: true,
      maximum: exclusiveMaximum
    }
  }

  return newAnnotations
}

/** @internal */
const getJSONSchemaAnnotation = (ast: AST.Annotated) =>
  pipe(
    ast,
    AST.getAnnotation<AST.JSONSchemaAnnotation>(AST.JSONSchemaAnnotationId),
    Option.map(convertJsonSchemaAnnotation)
  )

/** @internal */
const addDescription = (ast: AST.Annotated) => (schema: OpenApiTypes.OpenAPISchemaType) =>
  pipe(
    ast,
    AST.getAnnotation<AST.DescriptionAnnotation>(AST.DescriptionAnnotationId),
    Option.map((description) => ({ ...schema, description })),
    Option.getOrElse(() => schema)
  )

/** @internal */
const createEnum = <T extends AST.LiteralValue>(
  types: ReadonlyArray<T>,
  nullable: boolean
): OpenApiTypes.OpenAPISchemaEnumType => {
  const type = typeof types[0]

  if (type !== "string" && type !== "number") {
    throw new Error("Enum values must be either strings or numbers")
  }

  const nullableObj = nullable && { nullable: true }
  const values = types as ReadonlyArray<string | number>

  return {
    type,
    enum: nullable ? [...values, null] : [...values],
    ...nullableObj
  }
}

/** @internal */
const reference = (referenceName: string): OpenApiTypes.OpenAPISpecReference => ({
  $ref: `#/components/schemas/${referenceName}`
})

export type ComponentSchemaCallback = (id: string, ast: AST.AST) => void

/** @internal */
export const openAPISchemaForAst = (
  ast: AST.AST,
  componentSchemaCallback: ComponentSchemaCallback | undefined
): OpenApiTypes.OpenAPISchemaType => {
  const handleReference = (ast: AST.AST): OpenApiTypes.OpenAPISchemaType | null => {
    const identifier = Option.getOrUndefined(AST.getIdentifierAnnotation(ast))
    if (identifier !== undefined && componentSchemaCallback) {
      componentSchemaCallback(identifier, ast)
      return reference(identifier)
    }

    if (ast._tag === "Transformation") {
      const identifierTo = Option.getOrUndefined(AST.getIdentifierAnnotation(ast.to))
      const identifierFrom = Option.getOrUndefined(AST.getIdentifierAnnotation(ast.from))

      if (identifierTo !== undefined && identifierFrom === undefined && componentSchemaCallback) {
        componentSchemaCallback(identifierTo, ast.from)
        return reference(identifierTo)
      }
    }

    return null
  }

  const map = (ast: AST.AST): OpenApiTypes.OpenAPISchemaType => {
    switch (ast._tag) {
      case "Literal": {
        switch (typeof ast.literal) {
          case "bigint":
            return { type: "integer" }
          case "boolean":
            return { type: "boolean", enum: [ast.literal] }
          case "number":
            return { type: "number", enum: [ast.literal] }
          case "string":
            return { type: "string", enum: [ast.literal] }
          default:
            if (ast.literal === null) {
              return { type: "null" }
            }
            throw new Error(`Unknown literal type: ${typeof ast.literal}`)
        }
      }
      case "UnknownKeyword":
      case "AnyKeyword":
        return {}
      case "TemplateLiteral":
      case "StringKeyword": {
        return { type: "string" }
      }
      case "NumberKeyword":
        return { type: "number" }
      case "BooleanKeyword":
        return { type: "boolean" }
      case "ObjectKeyword":
        return { type: "object" }
      case "TupleType": {
        const elements = ast.elements.map((e) => go(e.type))
        const rest = ast.rest.map((t) => go(t.type))

        const minItems = ast.elements.filter((e) => !e.isOptional).length || undefined
        let maxItems = minItems
        let items: OpenApiTypes.OpenAPISchemaArrayType["items"] = elements.length === 0
          ? undefined
          : elements.length === 1
          ? elements[0]
          : elements
        let additionalItems = undefined

        // ---------------------------------------------
        // handle rest element
        // ---------------------------------------------
        if (Array.isNonEmptyArray(rest)) {
          const head = Array.headNonEmpty(rest)
          if (items !== undefined) {
            maxItems = undefined

            if (elements[0] !== items) {
              additionalItems = head
            }
          } else {
            items = head
            maxItems = undefined
          }
          // ---------------------------------------------
          // handle post rest elements
          // ---------------------------------------------
          // const tail = RA.tailNonEmpty(rest.value) // TODO
        }

        const minItemsObj = minItems === undefined ? undefined : { minItems }
        const maxItemsObj = maxItems === undefined ? undefined : { maxItems }
        const additionalItemsObj = additionalItems && { additionalItems }

        return {
          type: "array",
          ...minItemsObj,
          ...maxItemsObj,
          ...(items && { items }),
          ...additionalItemsObj
        }
      }
      case "TypeLiteral": {
        if (
          ast.indexSignatures.length <
            ast.indexSignatures.filter(
              (is) => is.parameter._tag === "StringKeyword"
            ).length
        ) {
          throw new Error(
            `Cannot encode some index signature to OpenAPISchema`
          )
        }
        const reference = handleReference(ast)
        if (reference) {
          return reference
        }

        const propertySignatures = ast.propertySignatures.map((ps) => {
          const type = ps.type

          if (
            type._tag === "Union" &&
            type.types.some(AST.isUndefinedKeyword)
          ) {
            const typeWithoutUndefined = AST.Union.make(
              type.types.filter((ast) => !AST.isUndefinedKeyword(ast)),
              type.annotations
            )
            return [go(typeWithoutUndefined), true] as const
          }

          return [go(type), ps.isOptional] as const
        })

        const indexSignatures = ast.indexSignatures.map((is) => go(is.type))
        const output: OpenApiTypes.OpenAPISchemaObjectType = { type: "object" }

        // ---------------------------------------------
        // handle property signatures
        // ---------------------------------------------
        for (let i = 0; i < propertySignatures.length; i++) {
          const [signature, isOptional] = propertySignatures[i]
          const name = ast.propertySignatures[i].name

          if (typeof name !== "string") {
            throw new Error(
              `Cannot encode ${String(name)} key to OpenAPISchema Schema`
            )
          }

          output.properties = output.properties ?? {}
          output.properties[name] = signature
          // ---------------------------------------------
          // handle optional property signatures
          // ---------------------------------------------
          if (!isOptional) {
            output.required = output.required ?? []
            output.required.push(name)
          }
        }
        // ---------------------------------------------
        // handle index signatures
        // ---------------------------------------------
        if (indexSignatures.length > 0) {
          output.additionalProperties = indexSignatures.length === 1
            ? indexSignatures[0]
            : { oneOf: indexSignatures }
        }

        return output
      }
      case "Union": {
        const reference = handleReference(ast)
        if (reference) {
          return reference
        }
        const nullable = ast.types.find(
          (a) => a._tag === "Literal" && a.literal === null
        )
        const nonNullables = ast.types.filter((a) => a !== nullable)
        const nullableObj = nullable && { nullable: true }

        if (nonNullables.length === 1) {
          if (nonNullables[0]._tag === "Enums") {
            return createEnum(
              nonNullables[0].enums.map(([_, value]) => value),
              nullable !== undefined
            )
          }
          return {
            ...go(nonNullables[0]),
            ...nullableObj
          }
        }

        if (nonNullables.every((i): i is AST.Literal => i._tag === "Literal")) {
          return createEnum(
            nonNullables.map((i) => i.literal),
            nullable !== undefined
          )
        }

        return {
          oneOf: nonNullables.map(go),
          ...nullableObj
        }
      }
      case "Enums": {
        const reference = handleReference(ast)
        if (reference) {
          return reference
        }
        return createEnum(
          ast.enums.map(([_, value]) => value),
          false
        )
      }
      case "Refinement": {
        const from = go(ast.from)

        const formatSchema = pipe(
          AST.getIdentifierAnnotation(ast),
          Option.filter((identifier) => identifier === "Date"),
          Option.as({ format: "date-time" }),
          Option.getOrElse(() => ({}))
        )

        return pipe(
          getJSONSchemaAnnotation(ast),
          Option.getOrElse(() => ({})),
          (schema) => ({ ...from, ...schema, ...formatSchema })
        )
      }
      case "Transformation": {
        if (ast.from._tag === "TypeLiteral") {
          const reference = handleReference(ast)
          if (reference) {
            return reference
          }
        }

        const spec = getOpenApiAnnotation(ast).pipe(
          Option.map((a) => (u: OpenApiTypes.OpenAPISchemaType) => ({ ...u, ...a((schema) => go(schema.ast)) })),
          Option.getOrElse(() => identity<OpenApiTypes.OpenAPISchemaType>)
        )

        return spec(go(ast.from))
      }
      case "Declaration": {
        const spec = getOpenApiAnnotation(ast)

        if (Option.isSome(spec)) {
          return spec.value((schema) => go(schema.ast))
        }

        throw new Error(
          `Cannot encode Declaration to OpenAPISchema, please specify OpenApi annotation for custom schemas`
        )
      }
      case "Suspend": {
        const realAst = ast.f()
        const identifier = Option.getOrUndefined(AST.getIdentifierAnnotation(ast)) ??
          Option.getOrUndefined(AST.getIdentifierAnnotation(realAst))
        if (!identifier) {
          console.warn(`Lazy schema must have identifier set.`)
          return {}
        }
        return go(
          AST.annotations(realAst, { [AST.IdentifierAnnotationId]: identifier })
        )
      }
      case "UniqueSymbol":
      case "UndefinedKeyword":
      case "VoidKeyword":
      case "NeverKeyword":
      case "BigIntKeyword":
      case "SymbolKeyword": {
        console.warn(`Schema tag "${ast._tag}" is not supported for OpenAPI.`)
        return {}
      }
    }
  }

  const go = (ast: AST.AST): OpenApiTypes.OpenAPISchemaType => pipe(map(ast), addDescription(ast))

  return go(ast)
}

/** @internal */
export const makeSchema = (
  schema: Schema.Schema.Any,
  componentSchemaCallback?: ComponentSchemaCallback
): OpenApiTypes.OpenAPISchemaType => {
  return openAPISchemaForAst(schema.ast, componentSchemaCallback)
}
