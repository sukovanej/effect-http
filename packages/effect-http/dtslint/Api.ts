import { Api } from "effect-http"

// $ExpectType Api<never>
Api.make().pipe(
  Api.setOptions({ title: "My API" })
)

// $ExpectType Api<Default<"hello">>
Api.make().pipe(
  Api.addEndpoint(Api.get("hello", "/hello")),
  Api.setOptions({ title: "My API" })
)

// $ExpectType Api<Default<"hello">>
Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setEndpointOptions({ description: "My endpoint" })
    )
  ),
  Api.setOptions({ title: "My API" })
)
