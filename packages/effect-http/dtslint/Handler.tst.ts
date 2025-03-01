import { Effect } from "effect"
import type { ApiEndpoint } from "effect-http"
import { Api, Handler } from "effect-http"
import { describe, expect, it } from "tstyche"

const endpoint1 = Api.get("endpoint1", "/endpoint1")
const endpoint2 = Api.get("endpoint2", "/endpoint2")
const endpoint3 = Api.get("endpoint3", "/endpoint3")

declare const eff1: Effect.Effect<void, "E1", "R1">
declare const eff2: Effect.Effect<void, "E2", "R2">
declare const eff3: Effect.Effect<void, "E3", "R3">

describe("Handler", () => {
  it("make", () => {
    expect(Handler.make(endpoint1, () => Effect.void)).type.toBe<
      Handler.Handler<ApiEndpoint.ApiEndpoint.Default<"endpoint1">, never, never>
    >()

    expect(endpoint1.pipe(Handler.make(() => Effect.void))).type.toBe<
      Handler.Handler<ApiEndpoint.ApiEndpoint.Default<"endpoint1">, never, never>
    >()
  })

  it("concat", () => {
    expect(Handler.concat(
      Handler.make(endpoint1, () => Effect.void),
      Handler.make(endpoint2, () => Effect.void)
    )).type.toBe<
      Handler.Handler<
        ApiEndpoint.ApiEndpoint.Default<"endpoint1"> | ApiEndpoint.ApiEndpoint.Default<"endpoint2">,
        never,
        never
      >
    >()

    expect(
      Handler.make(endpoint1, () => Effect.void).pipe(Handler.concat(
        Handler.make(endpoint2, () => Effect.void)
      ))
    ).type.toBe<
      Handler.Handler<
        ApiEndpoint.ApiEndpoint.Default<"endpoint1"> | ApiEndpoint.ApiEndpoint.Default<"endpoint2">,
        never,
        never
      >
    >()
  })

  it("concat with errors and context", () => {
    expect(
      Handler.concat(
        Handler.make(endpoint1, () => eff1),
        Handler.make(endpoint2, () => Effect.void)
      )
    ).type.toBe<
      Handler.Handler<
        ApiEndpoint.ApiEndpoint.Default<"endpoint1"> | ApiEndpoint.ApiEndpoint.Default<"endpoint2">,
        "E1",
        "R1"
      >
    >()

    expect(
      Handler.concat(
        Handler.make(endpoint1, () => eff1),
        Handler.make(endpoint2, () => eff2)
      )
    ).type.toBe<
      Handler.Handler<
        ApiEndpoint.ApiEndpoint.Default<"endpoint1"> | ApiEndpoint.ApiEndpoint.Default<"endpoint2">,
        "E1" | "E2",
        "R1" | "R2"
      >
    >()

    expect(
      Handler.concatAll(
        Handler.make(endpoint1, () => eff1),
        Handler.make(endpoint2, () => eff2),
        Handler.make(endpoint3, () => eff3)
      )
    ).type.toBe<
      Handler.Handler<
        | ApiEndpoint.ApiEndpoint.Default<"endpoint1">
        | ApiEndpoint.ApiEndpoint.Default<"endpoint2">
        | ApiEndpoint.ApiEndpoint.Default<"endpoint3">,
        "E1" | "E2" | "E3",
        "R1" | "R2" | "R3"
      >
    >()
  })
})
