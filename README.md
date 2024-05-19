# effect-http

![download badge](https://img.shields.io/npm/dm/effect-http.svg)

High-level declarative HTTP library for [Effect-TS](https://github.com/Effect-TS) built on top of
[@effect/platform](https://github.com/effect-ts/platform).

- :star: **Client derivation**. Write the api specification once, get the type-safe client with runtime validation for free.
- :rainbow: **OpenAPI derivation**. `/docs` endpoint with OpenAPI UI out of box.
- :battery: **Batteries included server implementation**. Automatic runtime request and response validation.
- :crystal_ball: **Example server derivation**. Automatic derivation of example server implementation.
- :bug: **Mock client derivation**. Test safely against a specified API.

**Under development.** Please note that currently any release might introduce
breaking changes and the internals and the public API are still evolving and changing.

> [!NOTE]
> This is an unofficial community package. You might benefit from checking the `@effect/platform`
> and `@effect/rpc` packages as they are the official Effect packages. The `effect-http` package strongly 
> relies on `@effect/platform`, and knowledge of it can be beneficial for understanding what 
> the `effect-http` does under the hood.

## Quickstart

- [Quickstart](#quickstart)
- [Request validation](#request-validation)
  - [Example](#example)
  - [Optional path parameters](#optional-path-parameters)
- [Headers](#headers)
- [Security](#security)
- [Responses](#responses)
- [Testing the server](#testing-the-server)
- [Error handling](#error-handling)
  - [Reporting errors in handlers](#reporting-errors-in-handlers)
  - [Example API with conflict API error](#example-api-with-conflict-api-error)
- [Grouping endpoints](#grouping-endpoints)
- [Descriptions in OpenApi](#descriptions-in-openapi)
- [Representations](#representations)
- [API on the client side](#api-on-the-client-side)
  - [Example server](#example-server)
  - [Mock client](#mock-client)
- [Router handlers](#router-handlers)
- [Compatibility](#compatibility)

Install 

- `effect-http` - platform-agnostic, this one is enough if you intend to use it in browser only
- `effect-http-node` - if you're planning to run a HTTP server on a node

```bash
pnpm add effect-http effect-http-node
```

Note that `effect`, `@effect/platform` and `@effect/platform-node` are requested as peer dependencies.
You very probably have them already. If not, install them using

```bash
pnpm add effect @effect/platform @effect/platform-node
```

The `@effect/platform-node` is needed only for the node version.

Bootstrap a simple API specification.

```typescript
import { Schema } from "@effect/schema";
import { Api } from "effect-http";

const UserResponse = Schema.Struct({
  name: Schema.String,
  id: pipe(Schema.Number, Schema.int(), Schema.positive())
})
const GetUserQuery = Schema.Struct({ id: Schema.NumberFromString })

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

Create the app implementation.

```typescript
import { Effect, pipe } from "effect";
import { RouterBuilder } from "effect-http";

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: "milan", id: query.id })),
  RouterBuilder.build
)
```

Now, we can generate an object providing the HTTP client interface using `Client.make`.

```typescript
import { Client } from "effect-http";

const client = Client.make(api, { baseUrl: "http://localhost:3000" });
```

Spawn the server on port 3000,

```typescript
import { NodeRuntime } from "@effect/platform-node"
import { NodeServer } from "effect-http-node";

app.pipe(NodeServer.listen({ port: 3000 }), NodeRuntime.runMain);
```

and call it using the `client`.

```ts
const response = pipe(
  client.getUser({ query: { id: 12 } }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
  Effect.scoped,
);
```

[\[Source code\]](./packages/effect-http-node/examples/readme-quickstart.ts)

Also, check the auto-generated OpenAPI UI running on
[localhost:3000/docs](http://localhost:3000/docs/). How awesome is that!

![open api ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-openapi-ui.png)

### Request validation

Each endpoint can declare expectations on the request format. Specifically,

- `body` - request body
- `query` - query parameters
- `path` - path parameters
- `headers` - request headers

They are specified in the input schemas object (3rd argument of `Api.get`, `Api.post`, ...).

#### Example

```typescript
import { Schema } from "@effect/schema";
import { Api } from "effect-http";

const Stuff = Schema.Struct({ value: Schema.Number })
const StuffRequest = Schema.Struct({ field: Schema.Array(Schema.String) })
const StuffQuery = Schema.Struct({ value: Schema.String })
const StuffPath = Schema.Struct({ param: Schema.String })

export const api = Api.make({ title: "My api" }).pipe(
  Api.addEndpoint(
    Api.post("stuff", "/stuff/:param").pipe(
      Api.setRequestBody(StuffRequest),
      Api.setRequestQuery(StuffQuery),
      Api.setRequestPath(StuffPath),
      Api.setResponseBody(Stuff)
    )
  )
)
```

[\[Source code\]](./packages/effect-http-node/examples/request-validation.ts)

#### Optional path parameters

Optional parameter is denoted using a question mark in the path
match pattern. In the request param schema, use `Schema.optional(<schema>)`.

In the following example the last `:another` path parameter can be
ommited on the client side.

```typescript
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api } from "effect-http"

const Stuff = Schema.Struct({ value: Schema.Number })
const StuffParams = Schema.Struct({
  param: Schema.String,
  another: Schema.optional(Schema.String)
})

export const api = pipe(
  Api.make({ title: "My api" }),
  Api.addEndpoint(
    pipe(
      Api.get("stuff", "/stuff/:param/:another?"),
      Api.setResponseBody(Stuff),
      Api.setRequestPath(StuffParams)
    )
  )
)
```

[\[Source code\]](./packages/effect-http-node/examples/request-validation-optional-parameter.ts)

### Headers

Request headers are part of input schemas along with the request body or query parameters.
Their schema is specified similarly to query parameters and path parameters, i.e. using
a mapping from header names onto their schemas. The example below shows an API with
a single endpoint `/hello` which expects a header `X-Client-Id` to be present.

```typescript
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestHeaders(Schema.Struct({ "x-client-id": Schema.String }))
    )
  )
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
```

[\[Source code\]](./packages/effect-http-node/examples/readme-headers.ts)

Server implementation deals with the validation the usual way. For example, if we try
to call the endpoint without the header we will get the following error response.

```json
{
  "error": "Request validation error",
  "location": "headers",
  "message": "x-client-id is missing"
}
```

And as usual, the information about headers will be reflected in the generated
OpenAPI UI.

![example-headers-openapi-ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-headers-openapi-ui.png)

**Important!** Use a lowercase form of header names.

### Security

To deal with authentication / authorization, the `effect-http` exposes the `Security` module. `Security.Security<A, E, R>`
is a structure capturing information how to document the security mechanism within the OpenAPI and how to parse the
incomming server request to produce a value `A` available for the endpoint handler.

To to secure an endpoint, use the `Api.setSecurity` combinator. Let's see an example of a secured endpoint
using the basic auth.

```ts
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, RouterBuilder, Security } from "effect-http"
import { NodeServer } from "effect-http-node"

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("mySecuredEndpoint", "/my-secured-endpoint").pipe(
      Api.setResponseBody(Schema.String),
      Api.setSecurity(Security.basic())
    )
  )
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(
    "mySecuredEndpoint",
    (_, security) => Effect.succeed(`Accessed as ${security.user}`)
  ),
  RouterBuilder.build
)

app.pipe(NodeServer.listen({ port: 3000 }), NodeRuntime.runMain)
```

[\[Source code\]](./packages/effect-http-node/examples/readme-security-basic.ts)

In the example, we use the `Security.basic()` constructor which produces a new security of type
`Security<BasicCredentials, never, never>`. In the second argument of our handler
function, we receive the value of `BasicCredentials` if the request contains a valid
authorization header with the basic auth credentials.

In case the request doesn't include valid authorization, the client will get a `401 Unauthorized` response
with a JSON body containing the error message.

#### Optional security

Implementation-wise, the `Security<A, E, R>` contains an `Effect<A, E | HttpError, R | ServerRequest>`.
Therefore, we can combine multiple security mechanisms similarly as if we were combining effects.

For instance, we could make the authentication optional using the `Security.or` combinator.

```ts
const mySecurity = Security.or(
  Security.asSome(Security.basic()),
  Security.as(Security.unit, Option.none())
)
```

[\[Source code\]](./packages/effect-http-node/examples/readme-security.ts)

The `Security.asSome`, `Security.as` and `Security.unit` behave the same way as their `Effect` counterparts.

#### Constructing more complex security

The following example show-cases how to construct a security mechanism that validates 
the basic auth credentials and then fetches the user information from the `UserStorage` service.

```ts
import { Effect, Layer, pipe } from "effect"
import { Security } from "effect-http"

interface UserInfo {
  email: string
}

class UserStorage extends Effect.Tag("UserStorage")<
  UserStorage,
  { getInfo: (user: string) => Effect.Effect<UserInfo> }
>() {
  static dummy = Layer.succeed(
    UserStorage,
    UserStorage.of({
      getInfo: (_: string) => Effect.succeed({ email: "email@gmail.com" })
    })
  )
}

const mySecurity = pipe(
  Security.basic({ description: "My basic auth" }),
  Security.map((creds) => creds.user),
  Security.mapEffect((user) => UserStorage.getInfo(user))
)
```

In the handler implementation, we obtain the `security` argument typed as `UserInfo`.

```ts
const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(
    "endpoint",
    (_, security) => Effect.succeed(`Logged as ${security.email}`)
  ),
  RouterBuilder.build,
  Middlewares.errorLog
)
```

And finally, because we made use of the effect context, we are forced to provide the `UserStorage`
when running the server.

```ts
app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(UserStorage.dummy),
  NodeRuntime.runMain
)
```

[\[Source code\]](./packages/effect-http-node/examples/readme-security-complex.ts)

#### Security on the client side

Each endpoint method accepts an optional second argument of type `(request: ClientRequest) => ClientRequest`
used to map internally produced `HttpClient.request.ClientRequest`. We can provide the header mapping
to set the appropriate header. Additionally, the `Client` module exposes `Client.setBasic` and `Client.setBearer`
combinators that produce setter functions configuring the `Authorization` header.

```ts
import { Client } from 'effect-http';

const client = Client.make(api)

client.endpoint({}, Client.setBasic("user", "pass"))
```

#### Custom security

A primitive security is constructed using `Security.make` function.

It accepts a handler effect which is expected to access the `ServerRequest` 
and possibly fail with a `HttpError`.

If we want to document the authorization mechanism in the OpenAPI, we must also provide the second argument
of the `Security.make` which is a mapping of the auth identifier and actual security scheme spec.

Here is an example of a security validating a `X-API-KEY` header.

```ts
import { HttpServer } from "@effect/platform"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Security, HttpError } from "effect-http"

const customSecurity = Security.make(
  pipe(
    HttpServer.request.schemaHeaders(Schema.Struct({ "x-api-key": Schema.String })),
    Effect.mapError(() => HttpError.unauthorizedError("Expected valid X-API-KEY header")),
    Effect.map((headers) => headers["x-api-key"])
  ),
  { "myApiKey": { name: "x-api-key", type: "apiKey", in: "header", description: "My API key" } }
)
```

[\[Source code\]](./packages/effect-http-node/examples/readme-security-custom.ts)

If the client doesn't provide the `X-API-KEY` header, the server will respond with `401 Unauthorized` status
and the given message.

> [!NOTE]
> In this particular case, you can use `Security.apiKey({ key: "X-API-KEY", in: "header" })` instead
> of a custom security.

### Responses

Every new endpoint has default response with status code 200 with ignored
response and headers.

If you want to customize the default response, use the `Api.setResponseStatus`,
`Api.setResponseBody` or `Api.setResponseHeaders` combinators. The following
example shows how to enforce (both for types and runtime) that returned status,
body and headers conform the specified response.

```ts
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api } from "effect-http"

const api = pipe(
  Api.make(),
  Api.addEndpoint(
    pipe(
      Api.get("hello", "/hello"),
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.Number),
      Api.setResponseHeaders(Schema.Struct({ "x-hello-world": Schema.String }))
    )
  )
)
```

[\[Source code\]](./packages/effect-http-node/examples/custom-response.ts)

It is also possible to specify multiple response schemas. Use the `Api.addResponse`
combinator to another possible response of an endpoint. The `Api.addResponse` accepts
either an `ApiResponse` object created using `ApiResponse.make` or a plain object of
form `{ status; headers; body}`.

```ts
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, ApiResponse, RouterBuilder } from "effect-http"

const helloEndpoint = Api.post("hello", "/hello").pipe(
  Api.setResponseBody(Schema.Number),
  Api.setResponseHeaders(Schema.Struct({
    "my-header": pipe(
      Schema.NumberFromString,
      Schema.description("My header")
    )
  })),
  Api.addResponse(ApiResponse.make(201, Schema.Number)),
  Api.addResponse({ status: 204, headers: Schema.Struct({ "x-another": Schema.NumberFromString }) })
)

const api = pipe(
  Api.make(),
  Api.addEndpoint(helloEndpoint)
)
```

The server implemention is type-checked against the api responses
and one of the specified response objects must be returned.

Note: the `status` needs to be `as const` because without it Typescript
will infere the `number` type.

```ts
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", () => Effect.succeed({ body: 12, headers: { "my-header": 69 }, status: 201 as const })),
  RouterBuilder.build
)
```

### Testing the server

You need to install `effect-http-node`.

While most of your tests should focus on the functionality independent
of HTTP exposure, it can be beneficial to perform integration or
contract tests for your endpoints. The `NodeTesting` module offers a
`NodeTesting.make` combinator that generates a testing client from
the Server. This derived testing client has a similar interface
to the one derived by `Client.make`.

Now, let's write an example test for the following server.

```ts
const api = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: Schema.String,
  }),
);

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("hello", ({ query }) =>
    Effect.succeed(`${query.input + 1}`),
  ),
  RouterBUilder.build,
);
```

The test might look as follows.

```ts
import { NodeTesting } from 'effect-http-node';

test("test /hello endpoint", async () => {
  const response = await NodeTesting.make(app, api).pipe(
    Effect.flatMap((client) => client.hello({ query: { input: 12 } })),
    Effect.scoped,
    Effect.runPromise,
  );

  expect(response).toEqual("13");
});
```

In comparison to the `Client` we need to run our endpoint handlers
in place. Therefore, in case your server uses DI services, you need to
provide them in the test code. This contract is type safe and you'll be
notified by the type-checker if the `Effect` isn't invoked with all
the required services.

### Error handling

Validation of query parameters, path parameters, body and even responses is
handled for you out of box. By default, failed validation will be reported
to clients in the response body. On the server side, you get warn logs with
the same information.

#### Reporting errors in handlers

On top of the automatic input and output validation, handlers can fail for variety
of different reasons.

Suppose we're creating user management API. When persisting a new user, we want
to guarantee we don't attempt to persist a user with an already taken name.
If the user name check fails, the API should return `409 CONFLICT` error because the client
is attempting to trigger an operatin conflicting with the current state of the server.
For these cases, `effect-http` provides error types and corresponding creational
functions we can use in the error rail of the handler effect.

##### 4xx

- 400 `HttpError.badRequest` - _client make an invalid request_
- 401 `HttpError.unauthorizedError` - _invalid authentication credentials_
- 403 `HttpError.forbiddenError` - _authorization failure_
- 404 `HttpError.notFoundError` - _cannot find the requested resource_
- 409 `HttpError.conflictError` - _request conflicts with the current state of the server_
- 415 `HttpError.unsupportedMediaTypeError` - _unsupported payload format_
- 429 `HttpError.tooManyRequestsError` - _the user has sent too many requests in a given amount of time_

##### 5xx

- 500 `HttpError.internalHttpError` - _internal server error_
- 501 `HttpError.notImplementedError` - _functionality to fulfill the request is not supported_
- 502 `HttpError.badGatewayError` - _invalid response from the upstream server_
- 503 `HttpError.serviceunavailableError` - _server is not ready to handle the request_
- 504 `HttpError.gatewayTimeoutError` - _request timeout from the upstream server_

#### Example API with conflict API error

Let's see it in action and implement the mentioned user management API. The
API will look as follows.

```typescript
import { Schema } from "@effect/schema";
import { Context, Effect, pipe } from "effect";
import { Api, RouterBuilder, HttpError } from "effect-http";
import { NodeServer } from "effect-http-node";

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.post("storeUser", "/users").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestBody(Schema.Struct({ name: Schema.String }))
    )
  )
)
```

Now, let's implement a `UserRepository` interface abstracting the interaction with
our user storage. I'm also providing a mock implementation which will always return
the user already exists. We will plug the mock user repository into our server
so we can see the failure behavior.

```typescript
interface UserRepository {
  userExistsByName: (name: string) => Effect.Effect<boolean>;
  storeUser: (user: string) => Effect.Effect<void>;
}

const UserRepository = Context.GenericTag<UserRepository>("UserRepository");

const mockUserRepository = UserRepository.of({
  userExistsByName: () => Effect.succeed(true),
  storeUser: () => Effect.unit,
});

const { userExistsByName, storeUser } = Effect.serviceFunctions(UserRepository);
```

And finally, we have the actual `App` implementation.

```typescript

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("storeUser", ({ body }) =>
    pipe(
      userExistsByName(body.name),
      Effect.filterOrFail(
        (alreadyExists) => !alreadyExists,
        () => HttpError.conflictError(`User "${body.name}" already exists.`),
      ),
      Effect.andThen(storeUser(body.name)),
      Effect.map(() => `User "${body.name}" stored.`),
    )),
  RouterBuilder.build,
);
```

To run the server, we will start the server using `NodeServer.listen` and provide
the `mockUserRepository` service.

```typescript
app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provideService(UserRepository, mockUserRepository),
  NodeRuntime.runMain
);
```

[\[Source code\]](./packages/effect-http-node/examples/conflict-error-example.ts)

Try to run the server and call the `POST /user`.

_Server_

```bash
$ pnpm tsx examples/conflict-error-example.ts

22:06:00 (Fiber #0) DEBUG Static swagger UI files loaded (1.7MB)
22:06:00 (Fiber #0) INFO  Listening on :::3000
22:06:01 (Fiber #8) WARN  POST /users client error 409
```

_Client_ (using [httpie cli](https://httpie.io/cli))

```bash
$ http localhost:3000/users name="patrik"

HTTP/1.1 409 Conflict
Content-Length: 68
Content-Type: application/json; charset=utf-8

User "patrik" already exists.
```

### Grouping endpoints

To create a new group of endpoints, use `ApiGroup.apiGroup("group name")`. This combinator
initializes new `ApiGroup` object. You can pipe it with combinators like `ApiGroup.addEndpoint`,
followed by `ApiGroup.get`, `Api.post`, etc, as if were defining the `Api`. Api groups can be combined into an
`Api` using a `Api.addGroup` combinator which merges endpoints from the group
into the api in the type-safe manner while preserving group names for each endpoint.

This enables separability of concers for big APIs and provides information for
generation of tags for the OpenAPI specification.

```typescript
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, ApiGroup, ExampleServer, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

const Response = Schema.Struct({ name: Schema.String })

const testApi = pipe(
  ApiGroup.make("test", {
    description: "Test description",
    externalDocs: {
      description: "Test external doc",
      url: "https://www.google.com/search?q=effect-http"
    }
  }),
  ApiGroup.addEndpoint(
    ApiGroup.get("test", "/test").pipe(Api.setResponseBody(Response))
  )
)

const userApi = pipe(
  ApiGroup.make("Users", {
    description: "All about users",
    externalDocs: {
      url: "https://www.google.com/search?q=effect-http"
    }
  }),
  ApiGroup.addEndpoint(
    ApiGroup.get("getUser", "/user").pipe(Api.setResponseBody(Response))
  ),
  ApiGroup.addEndpoint(
    ApiGroup.post("storeUser", "/user").pipe(Api.setResponseBody(Response))
  ),
  ApiGroup.addEndpoint(
    ApiGroup.put("updateUser", "/user").pipe(Api.setResponseBody(Response))
  ),
  ApiGroup.addEndpoint(
    ApiGroup.delete("deleteUser", "/user").pipe(Api.setResponseBody(Response))
  )
)

const categoriesApi = ApiGroup.make("Categories").pipe(
  ApiGroup.addEndpoint(
    ApiGroup.get("getCategory", "/category").pipe(Api.setResponseBody(Response))
  ),
  ApiGroup.addEndpoint(
    ApiGroup.post("storeCategory", "/category").pipe(Api.setResponseBody(Response))
  ),
  ApiGroup.addEndpoint(
    ApiGroup.put("updateCategory", "/category").pipe(Api.setResponseBody(Response))
  ),
  ApiGroup.addEndpoint(
    ApiGroup.delete("deleteCategory", "/category").pipe(Api.setResponseBody(Response))
  )
)

const api = Api.make().pipe(
  Api.addGroup(testApi),
  Api.addGroup(userApi),
  Api.addGroup(categoriesApi)
)

ExampleServer.make(api).pipe(
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
```

[\[Source code\]](./packages/effect-http-node/examples/groups.ts)

The OpenAPI UI will group endpoints according to the `api` and show
corresponding titles for each group.

![example-generated-open-api-ui](https://raw.githubusercontent.com/sukovanej/effect-http/master/assets/example-server-openapi-ui.png)

## Descriptions in OpenApi

The [schema-openapi](https://github.com/sukovanej/schema-openapi) library which is
used for OpenApi derivation from the `Schema` takes into account
[description](https://effect-ts.github.io/schema/modules/Schema.ts.html#description)
annotations and propagates them into the specification.

Some descriptions are provided from the built-in `@effect/schema/Schema` combinators.
For example, the usage of `Schema.Int.pipe(Schema.positive())` will result in "_a positive number_"
description in the OpenApi schema. One can also add custom description using the
`Schema.description` combinator.

On top of types descriptions which are included in the `schema` field, effect-http
also checks top-level schema descriptions and uses them for the parent object which
uses the schema. In the following example, the "_User_" description for the response
schema is used both as the schema description but also for the response itself. The
same holds for the `id` query paremeter.

For an operation-level description, call the API endpoint method (`Api.get`,
`Api.post` etc) with a 4th argument and set the `description` field to the
desired description.

```ts
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const Response = pipe(
  Schema.Struct({
    name: Schema.String,
    id: pipe(Schema.Number, Schema.int(), Schema.positive())
  }),
  Schema.description("User")
)
const Query = Schema.Struct({
  id: pipe(Schema.NumberFromString, Schema.description("User id"))
})

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user", { description: "Returns a User by id" }).pipe(
      Api.setResponseBody(Response),
      Api.setRequestQuery(Query)
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: "mike", id: query.id })),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
```

[\[Source code\]](./packages/effect-http-node/examples/description.ts)

## Representations

By default, the `effect-http` client and server will attempt the serialize/deserialize
messages as JSONs. This means that whenever you return something from a handler, the
internal logic will serialize it as a JSON onto a string and send the response along
with `content-type: application/json` header.

This behaviour is a result of a default [Representation.json](https://sukovanej.github.io/effect-http/modules/Representation.ts.html#json).
The default representation of the content can be changed using `Api.setResponseRepresentations`
combinator.

For example, the following API specification states that the response of `/test` endpoint
will be always a string represent as a plain text. Therefore, the HTTP message
will contain `content-type: text/plain` header.

```ts
export const api2 = Api.make().pipe(
  Api.addEndpoint(
    Api.get("myHandler", "/test").pipe(
      Api.setResponseBody(Schema.String),
      Api.setResponseRepresentations([Representation.plainText])
    )
  )
)
```

The `representations` is a list and if it contains multiple possible representations
of the data it internal server logic will respect incomming `Accept` header to decide
which representation to use.

The following example uses `plainText` and `json` representations. The order of
representations is respected by the logic that decides which representation should
be used, and if there is no representation matching the incomming `Accept` media type,
it will choose the first representation in the list.

```ts
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, Representation, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

export const api = Api.make({ title: "Example API" }).pipe(
  Api.addEndpoint(
    Api.get("root", "/").pipe(
      Api.setResponseBody(Schema.Unknown),
      Api.setResponseRepresentations([Representation.plainText, Representation.json])
    )
  )
)

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("root", () => Effect.succeed({ content: { hello: "world" }, status: 200 as const })),
  RouterBuilder.build
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
```

[\[Source code\]](./packages/effect-http-node/examples/plain-text.ts)

Try running the server above and call the root path with different
`Accept` headers. You should see the response content-type reflecting
the incomming `Accept` header.

``` bash
# JSON
curl localhost:3000/ -H 'accept: application/json' -v

# Plain text
curl localhost:3000/ -H 'accept: text/plain' -v
```

## API on the client side

While `effect-http` is intended to be primarly used on the server-side, i.e.
by developers providing the HTTP service, it is possible to use it also to
model, use and test against someone else's API. Out of box, you can make
us of the following combinators.

- `Client` - client for the real integration with the API.
- `MockClient` - client for testing against the API interface.
- `ExampleServer` - server implementation derivation with example responses.

### Example server

`effect-http` has the ability to generate an example server
implementation based on the `Api` specification. This can be
helpful in the following and probably many more cases.

- You're in a process of designing an API and you want to have _something_
  to share with other people and have a discussion over before the actual
  implementation starts.
- You develop a fullstack application with frontend first approach
  you want to test the integration with a backend you haven't
  implemeted yet.
- You integrate a 3rd party HTTP API and you want to have an ability to
  perform integration tests without the need to connect to a real
  running HTTP service.

Use `ExampleServer.make` combinator to generate a `RouterBuilder` from an `Api`.

```typescript
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, ExampleServer, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const Response = Schema.Struct({
  name: Schema.String,
  value: Schema.Number
})

const api = pipe(
  Api.make({ servers: ["http://localhost:3000", { description: "hello", url: "/api/" }] }),
  Api.addEndpoint(
    Api.get("test", "/test").pipe(Api.setResponseBody(Response))
  )
)

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  NodeRuntime.runMain
)
```

[\[Source code\]](./packages/effect-http-node/examples/example-server.ts)

Go to [localhost:3000/docs](http://localhost:3000/docs) and try calling
endpoints. The exposed HTTP service conforms the `api` and will return
only valid example responses.

### Mock client

To performed quick tests against the API interface, `effect-http` has
the ability to generate a mock client which will return example or
specified responses. Suppose we are integrating a hypothetical API
with `/get-value` endpoint returning a number. We can model such
API as follows.

```typescript
import { Schema } from "@effect/schema";
import { Api } from "effect-http";

const api = Api.make().pipe(
  Api.addEndpoint(
    Api.get("getValue", "/value").pipe(
      Api.setResponseBody(Schema.Number)
    )
  )
)
```

In a real environment, we will probably use the derived client
using `Client.make`. But for tests, we probably want a dummy
client which will return values conforming the API. For such
a use-case, we can derive a mock client.

```typescript
const client = MockClient.make(api);
```

Calling `getValue` on the client will perform the same client-side
validation as would be done by the real client. But it will return
an example response instead of calling the API. It is also possible
to enforce the value to be returned in a type-safe manner
using the option argument. The following client will always
return number `12` when calling the `getValue` operation.

```typescript
const client = MockClient.make(api, { responses: { getValue: 12 } });
```

### Router handlers

So far, we've been using the `RouterBuilder.handle` combinator to implement
the logic of the endpoint in place.

```ts
export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("endpoint", ({ query }) => Effect.succeed({ value: query.value + 1 })),
  RouterBuilder.build
)
```

The `RouterBuilder.handle` has also an overload which accepts a `Handler` object
that can be constructed using a `RouterBuilder.handler` combinator. This approach
allows e.g. to define the handler in a separate module.

```ts
const endpointHandler = RouterBuilder.handler(api, "endpoint", ({ query }) => 
  Effect.succeed({ value: query.value + 1 }))

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(endpointHandler),
  RouterBuilder.build
)
```

## Compatibility

This library is tested against nodejs 21.5.0.
