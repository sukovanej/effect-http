/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import * as FileSystem from "@effect/platform/FileSystem"
import * as Headers from "@effect/platform/Http/Headers"
import * as Router from "@effect/platform/Http/Router"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import * as Path from "@effect/platform/Path"
import { Option } from "effect"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ReadonlyRecord from "effect/ReadonlyRecord"
import type * as SwaggerRouter from "../SwaggerRouter.js"

/** @internal */
const createSwaggerInitializer = (path: string) => `
window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "${path}",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });
};
`

const createIndex = (path: string) => `
<!-- HTML for static distribution bundle build -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="${path}/swagger-ui.css" />
    <link rel="stylesheet" type="text/css" href="${path}/index.css" />
    <link rel="icon" type="image/png" href="${path}/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="${path}/favicon-16x16.png" sizes="16x16" />
  </head>

  <body>
    <div id="swagger-ui"></div>
    <script src="${path}/swagger-ui-bundle.js" charset="UTF-8"> </script>
    <script src="${path}/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
    <script src="${path}/swagger-initializer.js" charset="UTF-8"> </script>
  </body>
</html>
`

/** @internal */
const readFile = (path: string) => Effect.flatMap(FileSystem.FileSystem, (fs) => fs.readFileString(path, "utf-8"))

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
export const SwaggerFiles = Context.Tag<SwaggerRouter.SwaggerFiles>()

/** @internal */
export const SwaggerFilesLive = Effect.gen(function*(_) {
  const { getAbsoluteFSPath } = yield* _(
    Effect.promise(() => import("swagger-ui-dist"))
  )

  const absolutePath = getAbsoluteFSPath()

  const files = yield* _(
    SWAGGER_FILE_NAMES,
    Effect.forEach((path) => Effect.zip(Effect.succeed(path), readSwaggerFile(absolutePath, path))),
    Effect.map(ReadonlyRecord.fromEntries)
  )

  const size = Object.entries(files).reduce(
    (acc, [_, content]) => acc + content.length,
    0
  )
  const sizeMb = (size / 1024 / 1024).toFixed(1)

  yield* _(Effect.logDebug(`Static swagger UI files loaded (${sizeMb}MB)`))

  return { files }
}).pipe(Layer.effect(SwaggerFiles))

/** @internal */
const createHeaders = (file: string) => {
  if (file.endsWith(".html")) {
    return { "content-type": "text/html" }
  } else if (file.endsWith(".css")) {
    return { "content-type": "text/css" }
  } else if (file.endsWith(".js")) {
    return { "content-type": "application/javascript" }
  } else if (file.endsWith(".png")) {
    return { "content-type": "image/png" }
  }

  return undefined
}

/** @internal */
const serverStaticDocsFile = (filename: string, path?: Router.PathInput) => {
  const headers = createHeaders(filename)

  return Router.get(
    path ?? `/${filename}`,
    Effect.gen(function*(_) {
      const { files } = yield* _(SwaggerFiles)
      const content = files[filename]

      return ServerResponse.text(content, {
        headers: Headers.fromInput(headers)
      })
    })
  )
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const make = (spec: unknown) => {
  const basePath = "/docs"

  let router = SWAGGER_FILE_NAMES.reduce(
    (router, swaggerFileName) => router.pipe(serverStaticDocsFile(swaggerFileName, `${basePath}/${swaggerFileName}`)),
    Router.empty as Router.Router<SwaggerRouter.SwaggerFiles, never>
  )

  const serveIndex = Effect.gen(function*(_) {
    const context = yield* _(Router.RouteContext)
    const prefix = Option.getOrElse(context.route.prefix, () => "")
    const index = createIndex(`${prefix}${basePath}`)
    return ServerResponse.text(index, {
      headers: Headers.fromInput({
        "content-type": "text/html"
      })
    })
  })

  const serveSwaggerInitializer = Effect.gen(function*(_) {
    const context = yield* _(Router.RouteContext)
    const prefix = Option.getOrElse(context.route.prefix, () => "")
    const swaggerInitialiser = createSwaggerInitializer(`${prefix}${basePath}/openapi.json`)
    return ServerResponse.text(swaggerInitialiser, {
      headers: Headers.fromInput({
        "content-type": "application/javascript"
      })
    })
  })

  router = router.pipe(
    Router.get(`${basePath}`, serveIndex),
    Router.get(`${basePath}/index.html`, serveIndex),
    Router.get(`${basePath}/openapi.json`, pipe(ServerResponse.json(spec), Effect.orDie)),
    Router.get(`${basePath}/swagger-initializer.js`, serveSwaggerInitializer)
  )

  return router
}
