import { HttpClient, HttpServer } from "@effect/platform"
import { Effect, ReadonlyArray } from "effect"
import { SwaggerRouter } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { expect, test } from "vitest"

const docsUrls = [
  "/api/docs",
  "/api/docs/index.html",
  "/api/docs/swagger-ui.css",
  "/api/docs/swagger-ui-bundle.js",
  "/api/docs/swagger-ui-standalone-preset.js",
  "/api/docs/favicon-32x32.png"
]

test("swagger-router mount", () =>
  Effect.gen(function*(_) {
    const router = HttpServer.router.empty.pipe(
      HttpServer.router.mount("/api/docs", SwaggerRouter.make({}))
    )
    const client = yield* _(NodeTesting.makeRaw(router))
    const responses = yield* _(
      docsUrls,
      ReadonlyArray.map((url) => HttpClient.request.get(url)),
      Effect.forEach(client)
    )

    expect(responses.map((response) => response.status)).toStrictEqual(ReadonlyArray.replicate(200, docsUrls.length))

    for (const indexResponse of responses.slice(0, 2)) {
      const html = yield* _(indexResponse.text)
      expect(html).includes("/api/docs/swagger-ui.css")
    }
  }).pipe(Effect.scoped, Effect.runPromise))

test("swagger-router mountApp", () =>
  Effect.gen(function*(_) {
    const router = HttpServer.router.empty.pipe(
      HttpServer.router.mountApp("/api/docs", SwaggerRouter.make({}))
    )
    const client = yield* _(NodeTesting.makeRaw(router))
    const responses = yield* _(
      docsUrls,
      ReadonlyArray.map((url) => HttpClient.request.get(url)),
      Effect.forEach(client)
    )

    expect(responses.map((response) => response.status)).toStrictEqual(ReadonlyArray.replicate(200, docsUrls.length))

    for (const indexResponse of responses.slice(0, 2)) {
      const html = yield* _(indexResponse.text)
      expect(html).includes("/api/docs/swagger-ui.css")
    }
  }).pipe(Effect.scoped, Effect.runPromise))
