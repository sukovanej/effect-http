import { HttpClientRequest } from "@effect/platform"
import { it } from "@effect/vitest"
import { Effect } from "effect"
import { Api, Middlewares, RouterBuilder } from "effect-http"
import { NodeTesting } from "effect-http-node"
import { apply } from "effect/Function"
import { expect } from "vitest"

it.scoped(
  "cors",
  () =>
    Effect.gen(function*(_) {
      const api = Api.make().pipe(
        Api.addEndpoint(
          Api.get("test", "/test")
        )
      )

      const app = RouterBuilder.make(api).pipe(
        RouterBuilder.handle("test", () => Effect.void),
        RouterBuilder.build,
        Middlewares.cors({ allowedOrigins: ["localhost:3000"] })
      )

      const response = yield* _(
        NodeTesting.makeRaw(app),
        Effect.flatMap(apply(HttpClientRequest.get("/test")))
      )

      expect(response.headers["access-control-allow-origin"]).contains(
        "localhost:3000"
      )
    })
)
