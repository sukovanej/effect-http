/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import type { FileSystem, Path } from "@effect/platform"
import type { Layer } from "effect"
import type { SwaggerRouter } from "effect-http"
import * as internal from "./internal/node-swagger-files.js"

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFilesLive: Layer.Layer<SwaggerRouter.SwaggerFiles, never, FileSystem.FileSystem | Path.Path> =
  internal.SwaggerFilesLive
