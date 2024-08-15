import { FileSystem, Path } from "@effect/platform"
import * as Headers from "@effect/platform/Headers"
import * as HttpRouter from "@effect/platform/HttpRouter"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as HttpServerResponse from "@effect/platform/HttpServerResponse"
import { Context, Layer } from "effect"
import type * as Api from "effect-http/Api"
import * as OpenApi from "effect-http/OpenApi"
import type * as OpenApiTypes from "effect-http/OpenApiTypes"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import type * as HttpRedoc from "../HttpRedoc.js"

/** @internal */
const makeIndexHtml = (path: string) =>
  `<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  </head>
  <body>
    <redoc spec-url='${path}/openapi.json'></redoc>
    <script src="${path}/redoc.standalone.js"> </script>
  </body>
</html>`

/** @internal */
const calculatePrefix = Effect.gen(function*() {
  const request = yield* HttpServerRequest.HttpServerRequest
  const url = request.originalUrl
  const parts = url.split("/")

  if (!Array.isNonEmptyArray(parts)) {
    return ""
  }

  const last = parts[parts.length - 1]

  if (last.includes(".")) {
    return Array.join(Array.initNonEmpty(parts), "/")
  }

  return url
})

/** @internal */
export const make = (api: Api.Api.Any) => {
  const spec = OpenApi.make(api)
  return makeFromSpec(spec)
}

/** @internal */
export const RedocFiles = Context.GenericTag<HttpRedoc.RedocFiles>("effect-http-redoc/RedocFiles")

/** @internal */
export const RedocFilesLive = Effect.gen(function*() {
  const path = yield* Path.Path
  const fs = yield* FileSystem.FileSystem
  const redocStandaloneJsPath = path.resolve(import.meta.dirname, "../static/redoc.standalone.js")
  const redocStandaloneJs = yield* fs.readFile(redocStandaloneJsPath)
  return { redocStandaloneJs }
}).pipe(Layer.effect(RedocFiles))

/** @internal */
export const makeFromSpec = (spec: OpenApiTypes.OpenAPISpec) => {
  const serveIndex = Effect.gen(function*() {
    const prefix = yield* calculatePrefix
    const index = makeIndexHtml(prefix)
    return HttpServerResponse.text(index, { headers: Headers.fromInput({ "content-type": "text/html" }) })
  })

  return HttpRouter.empty.pipe(
    HttpRouter.get(`/`, serveIndex),
    HttpRouter.get(`/index.html`, serveIndex),
    HttpRouter.get(
      `/redoc.standalone.js`,
      RedocFiles.pipe(
        Effect.flatMap(({ redocStandaloneJs }) =>
          HttpServerResponse.uint8Array(redocStandaloneJs, {
            headers: Headers.fromInput({ "content-type": "application/javascript" })
          })
        )
      )
    ),
    HttpRouter.get(`/openapi.json`, Effect.orDie(HttpServerResponse.json(spec)))
  )
}
