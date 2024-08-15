/**
 * Create a router serving redoc docs.
 *
 * @since 1.0.0
 */
import type * as PlatformError from "@effect/platform/Error"
import type * as FileSystem from "@effect/platform/FileSystem"
import type * as HttpRouter from "@effect/platform/HttpRouter"
import type * as Path from "@effect/platform/Path"
import type * as Api from "effect-http/Api"
import type * as OpenApiTypes from "effect-http/OpenApiTypes"
import type * as Context from "effect/Context"
import type * as Layer from "effect/Layer"
import * as internal from "./internal/http-redoc.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface RedocFiles {
  redocStandaloneJs: Uint8Array
}

/**
 * @category tags
 * @since 1.0.0
 */
export const RedocFiles: Context.Tag<RedocFiles, RedocFiles> = internal.RedocFiles

/**
 * @category layers
 * @since 1.0.0
 */
export const RedocFilesLive: Layer.Layer<RedocFiles, PlatformError.PlatformError, Path.Path | FileSystem.FileSystem> =
  internal.RedocFilesLive

/**
 * @category constructors
 * @since 1.0.0
 */
export const makeFromSpec: (openApi: OpenApiTypes.OpenAPISpec) => HttpRouter.HttpRouter<never, RedocFiles> =
  internal.makeFromSpec

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: (api: Api.Api.Any) => HttpRouter.HttpRouter<never, RedocFiles> = internal.make
