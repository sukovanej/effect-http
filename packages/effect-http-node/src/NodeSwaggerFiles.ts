/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import type * as FileSystem from "@effect/platform/FileSystem"
import type * as Path from "@effect/platform/Path"
import type * as SwaggerRouter from "effect-http/SwaggerRouter"
import type * as Layer from "effect/Layer"
import * as internal from "./internal/node-swagger-files.js"

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFilesLive: Layer.Layer<SwaggerRouter.SwaggerFiles, never, FileSystem.FileSystem | Path.Path> =
  internal.SwaggerFilesLive
