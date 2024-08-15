/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpec {
  openapi: "3.0.3"
  info: OpenAPISpecInfo
  servers?: Array<OpenAPISpecServer>
  paths: OpenAPISpecPaths
  components?: OpenAPIComponents
  security?: Array<OpenAPISecurityRequirement>
  tags?: Array<OpenAPISpecTag>
  externalDocs?: OpenAPISpecExternalDocs
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecInfo {
  title: string
  version: string
  description?: string
  license?: OpenAPISpecLicense
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecTag {
  name: string
  description?: string
  externalDocs?: OpenAPISpecExternalDocs
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecExternalDocs {
  url: string
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecLicense {
  name: string
  url?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecServer {
  url: string
  description?: string
  variables?: Record<string, OpenAPISpecServerVariable>
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecServerVariable {
  default: string
  enum?: [string, ...Array<string>]
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecPaths = Record<
  string,
  OpenAPISpecPathItem
>

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecMethodName =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace"

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecPathItem =
  & {
    [K in OpenAPISpecMethodName]?: OpenAPISpecOperation
  }
  & {
    summary?: string
    description?: string
    parameters?: Array<OpenAPISpecParameter>
  }

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecParameter {
  name: string
  in: "query" | "header" | "path" | "cookie"
  schema: OpenAPISchemaType
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecResponses = Record<number, OpenApiSpecResponse>

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecContentType = "application/json" | "application/xml"

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecContent = {
  [K in OpenApiSpecContentType]?: OpenApiSpecMediaType
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenApiSpecResponseHeader {
  description?: string
  schema: OpenAPISchemaType
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecResponseHeaders = Record<
  string,
  OpenApiSpecResponseHeader
>

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenApiSpecResponse {
  content?: OpenApiSpecContent
  headers?: OpenApiSpecResponseHeaders
  description: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenApiSpecMediaType {
  schema?: OpenAPISchemaType
  example?: object
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecRequestBody {
  content: OpenApiSpecContent
  description?: string
  required?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecReference {
  $ref: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchemaType>
  securitySchemes?: Record<string, OpenAPISecurityScheme>
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPIHTTPSecurityScheme {
  type: "http"
  description?: string
  scheme: "bearer" | "basic" | string
  /* only for scheme: 'bearer' */
  bearerFormat?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPIApiKeySecurityScheme {
  type: "apiKey"
  description?: string
  name: string
  in: "query" | "header" | "cookie"
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPIMutualTLSSecurityScheme {
  type: "mutualTLS"
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPIOAuth2SecurityScheme {
  type: "oauth2"
  description?: string
  flows: Record<
    "implicit" | "password" | "clientCredentials" | "authorizationCode",
    Record<string, unknown>
  >
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPIOpenIdConnectSecurityScheme {
  type: "openIdConnect"
  description?: string
  openIdConnectUrl: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISecurityScheme =
  | OpenAPIHTTPSecurityScheme
  | OpenAPIApiKeySecurityScheme
  | OpenAPIMutualTLSSecurityScheme
  | OpenAPIOAuth2SecurityScheme
  | OpenAPIOpenIdConnectSecurityScheme
  | OpenAPISpecReference

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISecurityRequirement = Record<string, Array<string>>

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISpecOperation {
  requestBody?: OpenAPISpecRequestBody
  responses?: OpenAPISpecResponses
  operationId?: string
  description?: string
  parameters?: Array<OpenAPISpecParameter>
  summary?: string
  deprecated?: boolean
  tags?: Array<string>
  security?: Array<OpenAPISecurityRequirement>
  externalDocs?: OpenAPISpecExternalDocs
}

// Open API schema

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaNullType {
  type: "null"
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaStringType {
  type: "string"
  minLength?: number
  maxLength?: number
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaNumberType {
  type: "number" | "integer"
  minimum?: number
  exclusiveMinimum?: boolean
  maximum?: number
  exclusiveMaximum?: boolean
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaBooleanType {
  type: "boolean"
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaArrayType {
  type: "array"
  items?: OpenAPISchemaType | Array<OpenAPISchemaType>
  minItems?: number
  maxItems?: number
  additionalItems?: OpenAPISchemaType
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaEnumType {
  type: "string" | "number" | "boolean"
  enum: Array<string | number | boolean | null>
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaOneOfType {
  oneOf: ReadonlyArray<OpenAPISchemaType>
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaAllOfType {
  allOf: Array<OpenAPISchemaType>
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export interface OpenAPISchemaObjectType {
  type: "object"
  required?: Array<string>
  properties?: { [x: string]: OpenAPISchemaType }
  additionalProperties?: boolean | OpenAPISchemaType
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaAnyType = object

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaType =
  & {
    description?: string
  }
  & (
    | OpenAPISchemaNullType
    | OpenAPISchemaStringType
    | OpenAPISchemaNumberType
    | OpenAPISchemaBooleanType
    | OpenAPISchemaArrayType
    | OpenAPISchemaEnumType
    | OpenAPISchemaOneOfType
    | OpenAPISchemaAllOfType
    | OpenAPISchemaObjectType
    | OpenAPISchemaAnyType
    | OpenAPISpecReference
  )
