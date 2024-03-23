---
"effect-http": minor
"effect-http-node": minor
---

New security API.

The security was completely reworked to increase the flexibility how
the server deals with authorization and authentication.

The `SecurityScheme` module was removed and replaced by a new `Security` module.
It exposes a new `Security<A, E, R>` type that captures the security handling
and the OpenAPI specification. It also exposes a set of combinators that allow
to combine `Security` specs and enhance them with arbitrary effectful computations.

Before

```ts
const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("mySecuredEndpoint", "/my-secured-endpoint").pipe(
      Api.setResponseBody(Schema.string),
      Api.addSecurity(
        "mySecurity",
        {
          type: "http",
          options: {
            scheme: "basic",
          },
          schema: Schema.Secret
        }
      )
    )
  )
)
```

After

```ts
const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("mySecuredEndpoint", "/my-secured-endpoint").pipe(
      Api.setResponseBody(Schema.string),
      Api.setSecurity(Security.basic({}))
    )
  )
)
```

The client was modified to support the new security API. The second security argument
of endpoint methods was replaced by a general `(request: ClientRequest) => ClientRequest`
mapping. `Client` exposes two new helper functions `Client.setBasic` and `Client.setBearer`.

Before

```ts
client.security({}, { mySecurity: '...' })
```

After

```ts
client.endpoint({ ... }, Client.setBasic("user", "pass"))
```

Please refer to the main readme for more information on the new security API.
