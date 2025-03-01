import { Schema } from "effect"
import type { ApiRequest, ApiResponse, ApiSchema, Security } from "effect-http"
import { ApiEndpoint } from "effect-http"
import { describe, expect, it } from "tstyche"

describe("ApiGroup", () => {
  it("make", () => {
    expect(
      ApiEndpoint.get("hello", "/hello").pipe(
        ApiEndpoint.setOptions({ description: "my endpoint" })
      )
    ).type.toBe<ApiEndpoint.ApiEndpoint.Default<"hello">>()
  })

  it("correct request types", () => {
    ApiEndpoint.get("hello", "/hello").pipe(
      ApiEndpoint.setRequestQuery(
        // @ts-expect-error
        Schema.string
      )
    )

    ApiEndpoint.get("hello", "/hello").pipe(
      ApiEndpoint.setRequestPath(
        // @ts-expect-error
        Schema.string
      )
    )

    ApiEndpoint.get("hello", "/hello").pipe(
      ApiEndpoint.setRequestHeaders(
        // @ts-expect-error
        Schema.string
      )
    )

    ApiEndpoint.get("hello", "/hello").pipe(
      ApiEndpoint.setRequestQuery(
        // @ts-expect-error expecting accepting a string | undefined | string[]
        Schema.Struct({ field: Schema.Number })
      )
    )

    ApiEndpoint.get("hello", "/hello").pipe(
      ApiEndpoint.setRequestPath(
        // @ts-expect-error expecting accepting a string | undefined | string[]
        Schema.Struct({ field: Schema.Number })
      )
    )

    ApiEndpoint.get("hello", "/hello").pipe(
      ApiEndpoint.setRequestHeaders(
        // @ts-expect-error expecting accepting a string | undefined | string[]
        Schema.Struct({ field: Schema.Number })
      )
    )
  })

  it("array is supported for query", () => {
    expect(
      ApiEndpoint.get("hello", "/hello").pipe(
        ApiEndpoint.setRequestQuery(
          Schema.Struct({ field: Schema.Array(Schema.String) })
        )
      )
    ).type.toBe<
      ApiEndpoint.ApiEndpoint<
        "hello",
        ApiRequest.ApiRequest<
          ApiSchema.Ignored,
          ApiSchema.Ignored,
          { readonly field: ReadonlyArray<string> },
          ApiSchema.Ignored,
          never
        >,
        ApiResponse.ApiResponse.Default,
        Security.Security.Default
      >
    >()
  })
})

// array is supported for query
