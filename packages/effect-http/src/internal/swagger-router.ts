/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import * as HttpServer from "@effect/platform/HttpServer"
import * as Array from "effect/Array"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
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

/** @internal */
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
const SWAGGER_FILE_NAMES = [
  "index.css",
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "favicon-32x32.png",
  "favicon-16x16.png"
]

/** @internal */
export const SwaggerFiles = Context.GenericTag<SwaggerRouter.SwaggerFiles>("@services/SwaggerFiles")

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
const serverStaticDocsFile = (filename: string, path?: HttpServer.router.PathInput) => {
  const headers = createHeaders(filename)

  return HttpServer.router.get(
    path ?? `/${filename}`,
    Effect.gen(function*(_) {
      const { files } = yield* _(SwaggerFiles)
      const content = files[filename]

      return HttpServer.response.text(content, {
        headers: HttpServer.headers.fromInput(headers)
      })
    })
  )
}

/** @internal */
const calculatePrefix = Effect.gen(function*(_) {
  const request = yield* _(HttpServer.request.ServerRequest)

  const url = request.originalUrl

  const parts = url.split("/")

  if (!Array.isNonEmptyArray(parts)) {
    return ""
  }

  const last = parts[parts.length - 1]

  if (last.includes(".")) {
    return pipe(Array.initNonEmpty(parts), Array.join("/"))
  }

  return url
})

/** @internal */
export const make = (spec: unknown) => {
  let router = SWAGGER_FILE_NAMES.reduce(
    (router, swaggerFileName) => router.pipe(serverStaticDocsFile(swaggerFileName, `/${swaggerFileName}`)),
    HttpServer.router.empty as HttpServer.router.Router<never, SwaggerRouter.SwaggerFiles>
  )

  const serveIndex = Effect.gen(function*(_) {
    const prefix = yield* _(calculatePrefix)
    const index = createIndex(prefix)
    return HttpServer.response.text(index, {
      headers: HttpServer.headers.fromInput({
        "content-type": "text/html"
      })
    })
  })

  const serveSwaggerInitializer = Effect.gen(function*(_) {
    const prefix = yield* _(calculatePrefix)
    const swaggerInitialiser = createSwaggerInitializer(`${prefix}/openapi.json`)
    return HttpServer.response.text(swaggerInitialiser, {
      headers: HttpServer.headers.fromInput({
        "content-type": "application/javascript"
      })
    })
  })

  router = router.pipe(
    HttpServer.router.get(`/`, serveIndex),
    HttpServer.router.get(`/index.html`, serveIndex),
    HttpServer.router.get(`/openapi.json`, Effect.orDie(HttpServer.response.json(spec))),
    HttpServer.router.get(`/swagger-initializer.js`, serveSwaggerInitializer)
  )

  return router
}
