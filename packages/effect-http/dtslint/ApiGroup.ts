import { ApiGroup } from "effect-http"

// $ExpectType ApiGroup<never>
ApiGroup.make("myGroup").pipe(
  ApiGroup.setOptions({ description: "My group" })
)

// $ExpectType ApiGroup<Default<"hello">>
ApiGroup.make("myGroup").pipe(
  ApiGroup.addEndpoint(
    ApiGroup.get("hello", "/hello").pipe(
      ApiGroup.setEndpointOptions({ description: "My endpoint" })
    )
  ),
  ApiGroup.setOptions({ description: "My group" })
)
