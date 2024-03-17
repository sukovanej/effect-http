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

const UserResponse = Schema.struct({
  name: Schema.string,
  id: pipe(Schema.number, Schema.int(), Schema.positive())
})
const GetUserQuery = Schema.struct({ id: Schema.NumberFromString })

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
- `params` - path parameters
- `headers` - request headers

They are specified in the input schemas object (3rd argument of `Api.get`, `Api.post`, ...).

#### Example

```typescript
import { Schema } from "@effect/schema";
import { Api } from "effect-http";

const Stuff = Schema.struct({ value: Schema.number })
const StuffRequest = Schema.struct({ field: Schema.array(Schema.string) })
const StuffQuery = Schema.struct({ value: Schema.string })
const StuffPath = Schema.struct({ param: Schema.string })

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

const Stuff = Schema.struct({ value: Schema.number })
const StuffParams = Schema.struct({
  param: Schema.string,
  another: Schema.optional(Schema.string)
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
      Api.setResponseBody(Schema.string),
      Api.setRequestHeaders(Schema.struct({ "x-client-id": Schema.string }))
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

To define which security mechanisms should be used for a specific endpoint, fill `option.security` field in endpoint constructor.

```ts
import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const mySecuredEnpoint = Api.post("security", "/testSecurity", { description: "" }).pipe(
  Api.setResponseBody(Schema.string),
  Api.addSecurity(
    "myAwesomeBearerAuth", // arbitrary name for the security scheme
    {
      type: "http",
      options: {
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      // Schema<any, string> for decoding-encoding the significant part
      // "Authorization: Bearer <significant part>"
      schema: Schema.Secret
    }
  )
)

const api = Api.make().pipe(
  Api.addEndpoint(mySecuredEnpoint)
)
```

Currently, only the `"http"` type is supported. `bearer` and `basic` constructors are available from the `SecurityScheme` module.

Encoded security tokens are placed in the second parameter of the handler.

```ts
const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("security", (_, security) => {
    const token = security.myAwesomeBearerAuth.token // Secret
    return Effect.succeed(`your token ${token}`)
  }),
  RouterBuilder.build
)
```

In case several security schemes are specified, tokens will be `Either<ParseError, MyType>` type 
with the guarantee that at least one of them is of the `Right<MyType>` type

```ts
const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("security", (_, security) => {
    const token1 = security.myAwesomeBearerAuth.token; // Either<ParseError, Secret>
    const token2 = security.myAwesomeBasicAuth.token; // Either<ParseError, Secret>
    return Effect.succeed(`your token ${token}`)
  }),
  RouterBuilder.build
)
```

[\[Source code\]](./packages/effect-http-node/examples/readme-security.ts)

On the client side security token must be passed into the appropriate security scheme

```ts
client.security({}, {
  myAwesomeBearerAuth: bearerToken, // Secret
})
```

### Responses

Every new endpoint has default response with status code 200 with ignored
response and headers.

If you want to cusomize the default response, use the `Api.setResponseStatus`,
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
      Api.setResponseBody(Schema.number),
      Api.setResponseHeaders(Schema.struct({ "x-hello-world": Schema.string }))
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
  Api.setResponseBody(Schema.number),
  Api.setResponseHeaders(Schema.struct({
    "my-header": pipe(
      Schema.NumberFromString,
      Schema.description("My header")
    )
  })),
  Api.addResponse(ApiResponse.make(201, Schema.number)),
  Api.addResponse({ status: 204, headers: Schema.struct({ "x-another": Schema.NumberFromString }) })
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
    response: Schema.string,
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

- 400 `ServerError.badRequest` - _client make an invalid request_
- 401 `ServerError.unauthorizedError` - _invalid authentication credentials_
- 403 `ServerError.forbiddenError` - _authorization failure_
- 404 `ServerError.notFoundError` - _cannot find the requested resource_
- 409 `ServerError.conflictError` - _request conflicts with the current state of the server_
- 415 `ServerError.unsupportedMediaTypeError` - _unsupported payload format_
- 429 `ServerError.tooManyRequestsError` - _the user has sent too many requests in a given amount of time_

##### 5xx

- 500 `ServerError.internalServerError` - _internal server error_
- 501 `ServerError.notImplementedError` - _functionality to fulfill the request is not supported_
- 502 `ServerError.badGatewayError` - _invalid response from the upstream server_
- 503 `ServerError.serviceunavailableError` - _server is not ready to handle the request_
- 504 `ServerError.gatewayTimeoutError` - _request timeout from the upstream server_

#### Example API with conflict API error

Let's see it in action and implement the mentioned user management API. The
API will look as follows.

```typescript
import { Schema } from "@effect/schema";
import { Context, Effect, pipe } from "effect";
import { Api, RouterBuilder, ServerError } from "effect-http";
import { NodeServer } from "effect-http-node";

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.post("storeUser", "/users").pipe(
      Api.setResponseBody(Schema.string),
      Api.setRequestBody(Schema.struct({ name: Schema.string }))
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
        () => ServerError.conflictError(`User "${body.name}" already exists.`),
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

const Response = Schema.struct({ name: Schema.string })

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
  Schema.struct({
    name: Schema.string,
    id: pipe(Schema.number, Schema.int(), Schema.positive())
  }),
  Schema.description("User")
)
const Query = Schema.struct({
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
      Api.setResponseBody(Schema.string),
      Api.setResponseRepresentations([Representation.plainText])
    )
  )
)
```

The `representations` is a list and if it contains multiple possible represetations
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
      Api.setResponseBody(Schema.unknown),
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

const Response = Schema.struct({
  name: Schema.string,
  value: Schema.number
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
      Api.setResponseBody(Schema.number)
    )
  )
)
```

In a real environment, we will probably use the derived client
using `MockClient.make`. But for tests, we probably want a dummy
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

## Compatibility

This library is tested against nodejs 21.5.0.
