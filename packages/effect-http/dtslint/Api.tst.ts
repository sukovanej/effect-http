import type { ApiEndpoint } from "effect-http"
import { Api } from "effect-http"
import { describe, expect, it } from "tstyche"

describe("Api", () => {
  it("make", () => {
    expect(Api.make().pipe(Api.setOptions({ title: "My API" }))).type.toBe<Api.Api<never>>()
  })

  it("make with addEndpoint", () => {
    expect(
      Api.make().pipe(
        Api.addEndpoint(Api.get("hello", "/hello")),
        Api.setOptions({ title: "My API" })
      )
    ).type.toBe<Api.Api<ApiEndpoint.ApiEndpoint.Default<"hello">>>()

    expect(
      Api.make().pipe(
        Api.addEndpoint(
          Api.get("hello", "/hello").pipe(
            Api.setEndpointOptions({ description: "My endpoint" })
          )
        ),
        Api.setOptions({ title: "My API" })
      )
    ).type.toBe<Api.Api<ApiEndpoint.ApiEndpoint.Default<"hello">>>()
  })
})
