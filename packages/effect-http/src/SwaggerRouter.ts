/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import type { HttpServer } from "@effect/platform"
import type { Context } from "effect"

import * as internal from "./internal/swagger-router.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface SwaggerFiles {
  files: Record<string, string>
}

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFiles: Context.Tag<SwaggerFiles, SwaggerFiles> = internal.SwaggerFiles

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (spec: unknown) => HttpServer.router.Router<SwaggerFiles, never> = internal.make
