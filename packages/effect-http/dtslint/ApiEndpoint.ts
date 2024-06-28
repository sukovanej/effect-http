import { Schema } from "@effect/schema"
import { ApiEndpoint } from "effect-http"

// $ExpectType Default<"hello">
ApiEndpoint.get("hello", "/hello").pipe(
  ApiEndpoint.setOptions({ description: "my endpoint" })
)

// parameters must by structs accepting string | undefined | string[]

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
    // @ts-expect-error expecting accpting a string | undefined | string[]
    Schema.Struct({ field: Schema.Number })
  )
)

ApiEndpoint.get("hello", "/hello").pipe(
  ApiEndpoint.setRequestPath(
    // @ts-expect-error expecting accpting a string | undefined | string[]
    Schema.Struct({ field: Schema.Number })
  )
)

ApiEndpoint.get("hello", "/hello").pipe(
  ApiEndpoint.setRequestHeaders(
    // @ts-expect-error expecting accpting a string | undefined | string[]
    Schema.Struct({ field: Schema.Number })
  )
)

// array is supported for query

ApiEndpoint.get("hello", "/hello").pipe(
  ApiEndpoint.setRequestQuery(
    Schema.Struct({ field: Schema.Array(Schema.String) })
  )
)
