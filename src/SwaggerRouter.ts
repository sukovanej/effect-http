/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import type * as FileSystem from "@effect/platform/FileSystem";
import type * as Router from "@effect/platform/Http/Router";
import type * as Path from "@effect/platform/Path";
import * as internal from "effect-http/internal/swagger-router";
import type * as Context from "effect/Context";
import type * as Layer from "effect/Layer";

/**
 * @category models
 * @since 1.0.0
 */
export interface SwaggerFiles {
  files: Record<string, string>;
}

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFiles: Context.Tag<SwaggerFiles, SwaggerFiles> =
  internal.SwaggerFiles;

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFilesLive: Layer.Layer<
  FileSystem.FileSystem | Path.Path,
  never,
  SwaggerFiles
> = internal.SwaggerFilesLive;

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (spec: unknown) => Router.Router<SwaggerFiles, never> =
  internal.make;
