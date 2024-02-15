/**
 * A security scheme is a way to protect an API from unauthorized access.
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import type * as OpenApi from "schema-openapi/OpenApiTypes"
import * as internal from "./internal/security-scheme.js"

/**
 * @category models
 * @since 1.0.0
 */
export type SecurityScheme<A> = HTTPSecurityScheme<A>

/**
 * @category models
 * @since 1.0.0
 */
export type HTTPSecurityScheme<A> = {
  type: OpenApi.OpenAPIHTTPSecurityScheme["type"]
  options: Omit<OpenApi.OpenAPIHTTPSecurityScheme, "type">
  schema: Schema.Schema<A, string>
}

/**
 * @category constants
 * @since 1.0.0
 */
export const BearerLiteral: BearerLiteral = internal.BearerLiteral

/**
 * @category models
 * @since 1.0.0
 */
export type BearerLiteral = "Bearer"

/**
 * @category refinements
 * @since 1.0.0
 */
export const isBearerLiteral: (u: unknown) => u is BearerLiteral = internal.isBearerLiteral

/**
 * Creates bearer http security scheme auth description
 *
 * @category constructors
 * @since 1.0.0
 */
export const bearer: <A>(args: {
  description?: string
  bearerFormat?: string
  tokenSchema: Schema.Schema<A, string>
}) => SecurityScheme<A> = internal.bearer

/**
 * @category constants
 * @since 1.0.0
 */
export const BasicLiteral: BasicLiteral = internal.BasicLiteral

/**
 * @category models
 * @since 1.0.0
 */
export type BasicLiteral = "Basic"

/**
 * @category refinements
 * @since 1.0.0
 */
export const isBasicLiteral: (u: unknown) => u is BasicLiteral = internal.isBasicLiteral

/**
 * Creates basic http security scheme auth description
 *
 * @category constructors
 * @since 1.0.0
 */
export const basic: <A>(args: {
  description?: string
  tokenSchema: Schema.Schema<A, string>
}) => SecurityScheme<A> = internal.basic
