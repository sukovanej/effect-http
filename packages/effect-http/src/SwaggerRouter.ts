/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import type * as HttpRouter from "@effect/platform/HttpRouter"
import type * as Context from "effect/Context"

import * as internal from "./internal/swagger-router.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface SwaggerFiles {
  files: Record<string, Uint8Array>
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
export const make: (spec: unknown) => HttpRouter.HttpRouter<never, SwaggerFiles> = internal.make
