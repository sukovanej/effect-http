import * as FileSystem from "@effect/platform/FileSystem"
import * as Path from "@effect/platform/Path"
import * as SwaggerRouter from "effect-http/SwaggerRouter"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Record from "effect/Record"
import { getAbsoluteFSPath } from "swagger-ui-dist"

/** @internal */
const readFile = (path: string) => Effect.flatMap(FileSystem.FileSystem, (fs) => fs.readFile(path))

/** @internal */
const SWAGGER_FILE_NAMES = [
  "index.css",
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "favicon-32x32.png",
  "favicon-16x16.png"
]

/** @internal */
const readSwaggerFile = (swaggerBasePath: string, file: string) =>
  Effect.flatMap(Path.Path, (path) => readFile(path.resolve(swaggerBasePath, file)).pipe(Effect.orDie))

/** @internal */
export const SwaggerFilesLive = Effect.gen(function*(_) {
  const absolutePath = getAbsoluteFSPath()

  const files = yield* _(
    SWAGGER_FILE_NAMES,
    Effect.forEach((path) => Effect.zip(Effect.succeed(path), readSwaggerFile(absolutePath, path))),
    Effect.map(Record.fromEntries)
  )

  const size = Object.entries(files).reduce(
    (acc, [_, content]) => acc + content.byteLength,
    0
  )
  const sizeMb = (size / 1024 / 1024).toFixed(1)

  yield* _(Effect.logDebug(`Static swagger UI files loaded (${sizeMb}MB)`))

  return { files }
}).pipe(Layer.effect(SwaggerRouter.SwaggerFiles))
