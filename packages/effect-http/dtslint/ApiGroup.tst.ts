import type { ApiEndpoint } from "effect-http"
import { ApiGroup } from "effect-http"
import { describe, expect, it } from "tstyche"

describe("ApiGroup", () => {
  it("make", () => {
    expect(ApiGroup.make("myGroup").pipe(ApiGroup.setOptions({ description: "My group" }))).type.toBe<
      ApiGroup.ApiGroup<never>
    >()

    expect(
      ApiGroup.make("myGroup").pipe(
        ApiGroup.addEndpoint(
          ApiGroup.get("hello", "/hello").pipe(
            ApiGroup.setEndpointOptions({ description: "My endpoint" })
          )
        ),
        ApiGroup.setOptions({ description: "My group" })
      )
    ).type.toBe<
      ApiGroup.ApiGroup<ApiEndpoint.ApiEndpoint.Default<"hello">>
    >()
  })
})
