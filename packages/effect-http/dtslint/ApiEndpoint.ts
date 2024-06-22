import { ApiEndpoint } from "effect-http"

// $ExpectType Default<"hello">
ApiEndpoint.get("hello", "/hello").pipe(
  ApiEndpoint.setOptions({ description: "my endpoint" })
)
