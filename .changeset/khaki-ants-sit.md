---
"effect-http-node": minor
"effect-http": minor
---

## New pipeable API

Overall, the API based on unnamed objects containing `response` and `request` fields 
was replaced by more strict and explicit pipeable API which constructs new `Api`, `ApiGroup`,
`ApiEndpoint`, `ApiResponse` and `ApiRequest` objects under the hood.

Before

```ts
const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get("getUser", "/user", {
    response: User,
    request: { query: GetUserQuery },
  }),
);
```

After

```ts
const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    pipe(
      Api.get("getUser", "/user"),
      Api.setResponseBody(UserResponse),
      Api.setRequestQuery(GetUserQuery)
    )
  )
)
```

## Multiple-response endpoints changes

The `content` field was renamed to `body`. So on the client side, an endpoint with multiple
responses now returns an object `{ status; body; headers }` instead of `{ status; content; headers }`.
The same on the server side, the handling function shall return the object with a `body` field
instead of `content`.

Also, with the new API, the *full response* is applied only in case the there is a single response
and it specifies headers or if there are multiple responses. So, in case the endpoint changes
the response status, the client now returns the body only.

```ts
const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    pipe(
      Api.post("createUser", "/user"),
      Api.setResponseStatus(201),
      Api.setResponseBody(UserResponse),
    )
  )
)

const client = Client.make(api)
client.createUser({}) // now returns `UserResponse` instead of `{ status: 201; body: UserResponse; headers? }`
```

Multiple responses can be now defined using `Api.addResponse` / `ApiGroup.addResponse` combinators. They
accept either a `ApiResponse` object (constructed using `ApiResponse.make`) or an object of shape
`{ status; body?; headers? }`.

```ts
const helloEndpoint = Api.post("hello", "/hello").pipe(
  // ApiResponse constructor
  Api.addResponse(ApiResponse.make(201, Schema.number)),
  // plain object
  Api.addResponse({ status: 204, headers: Schema.struct({ "x-another": Schema.NumberFromString }) })
)
```

## Security

The security was one of the reasons to introduce the new API. Previously, the way to declare
an authorization for an endpoint was to specify it in the endpoint options. Now, it is part
of the pipeable API.

```ts
const mySecuredEnpoint = Api.post("security", "/testSecurity").pipe(
  Api.setResponseBody(Schema.string),
  Api.addSecurity("myAwesomeBearerAuth", mySecuritySchema)
)

const api = Api.make().pipe(
  Api.addEndpoint(mySecuredEnpoint)
)
```
