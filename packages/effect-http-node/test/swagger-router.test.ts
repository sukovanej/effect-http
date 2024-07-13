import { HttpClientRequest, HttpRouter } from "@effect/platform"
import { expect, it } from "@effect/vitest"
import { Array, Effect } from "effect"
import { SwaggerRouter } from "effect-http"
import { NodeTesting } from "effect-http-node"

const docsUrls = [
  "/api/docs",
  "/api/docs/index.html",
  "/api/docs/swagger-ui.css",
  "/api/docs/swagger-ui-bundle.js",
  "/api/docs/swagger-ui-standalone-preset.js",
  "/api/docs/favicon-32x32.png"
]

it.scoped("swagger-router mount", () =>
  Effect.gen(function*(_) {
    const router = HttpRouter.empty.pipe(
      HttpRouter.mount("/api/docs", SwaggerRouter.make({}))
    )
    const client = yield* _(NodeTesting.makeRaw(router))
    const responses = yield* _(
      docsUrls,
      Array.map((url) => HttpClientRequest.get(url)),
      Effect.forEach(client)
    )

    expect(responses.map((response) => response.status)).toStrictEqual(Array.replicate(200, docsUrls.length))

    for (const indexResponse of responses.slice(0, 2)) {
      const html = yield* _(indexResponse.text)
      expect(html).includes("/api/docs/swagger-ui.css")
    }
  }))

it.scoped("swagger-router mountApp", () =>
  Effect.gen(function*(_) {
    const router = HttpRouter.empty.pipe(
      HttpRouter.mountApp("/api/docs", SwaggerRouter.make({}))
    )
    const client = yield* _(NodeTesting.makeRaw(router))
    const responses = yield* _(
      docsUrls,
      Array.map((url) => HttpClientRequest.get(url)),
      Effect.forEach(client)
    )

    expect(responses.map((response) => response.status)).toStrictEqual(Array.replicate(200, docsUrls.length))

    for (const indexResponse of responses.slice(0, 2)) {
      const html = yield* _(indexResponse.text)
      expect(html).includes("/api/docs/swagger-ui.css")
    }
  }))
