---
title: index.ts
nav_order: 5
parent: Modules
---

## index overview

`Api` represents the API specification. It doesn't hold information concerning the
server or client side details. An instance of `Api` can be used to derive a client
implementation (see `Client.ts`).

The generated type of the `Api` is used during server implementation. The type safety
guarantees the server-side implementation and the `Api` specification are compatible.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "./Api.js"](#from-apijs)
  - [From "./Client.js"](#from-clientjs)
  - [From "./ClientError.js"](#from-clienterrorjs)
  - [From "./ExampleServer.js"](#from-exampleserverjs)
  - [From "./Middlewares.js"](#from-middlewaresjs)
  - [From "./MockClient.js"](#from-mockclientjs)
  - [From "./NodeServer.js"](#from-nodeserverjs)
  - [From "./OpenApi.js"](#from-openapijs)
  - [From "./Representation.js"](#from-representationjs)
  - [From "./Route.js"](#from-routejs)
  - [From "./RouterBuilder.js"](#from-routerbuilderjs)
  - [From "./ServerError.js"](#from-servererrorjs)
  - [From "./SwaggerRouter.js"](#from-swaggerrouterjs)
  - [From "./Testing.js"](#from-testingjs)

---

# exports

## From "./Api.js"

`Api` represents the API specification. It doesn't hold information concerning the
server or client side details. An instance of `Api` can be used to derive a client
implementation (see `Client.ts`).

The generated type of the `Api` is used during server implementation. The type safety
guarantees the server-side implementation and the `Api` specification are compatible.

**Signature**

```ts
export * as Api from "./Api.js"
```

Added in v1.0.0

## From "./Client.js"

This module exposes the `client` combinator which accepts an `Api` instance
and it generates a client-side implementation. The generated implementation
is type-safe and guarantees compatibility of the client and server side.

**Signature**

```ts
export * as Client from "./Client.js"
```

Added in v1.0.0

## From "./ClientError.js"

Models for errors being created on the client side.

**Signature**

```ts
export * as ClientError from "./ClientError.js"
```

Added in v1.0.0

## From "./ExampleServer.js"

The `exampleServer` function generates a `Server` implementation based
on an instance of `Api`. The listening server will perform all the
request and response validations similarly to a real implementation.

Responses returned from the server are generated randomly using the
response `Schema`.

**Signature**

```ts
export * as ExampleServer from "./ExampleServer.js"
```

Added in v1.0.0

## From "./Middlewares.js"

Mechanism for extendning behaviour of all handlers on the server.

**Signature**

```ts
export * as Middlewares from "./Middlewares.js"
```

Added in v1.0.0

## From "./MockClient.js"

`Client` implementation derivation for testing purposes.

**Signature**

```ts
export * as MockClient from "./MockClient.js"
```

Added in v1.0.0

## From "./NodeServer.js"

Simplified way to run a node server.

**Signature**

```ts
export * as NodeServer from "./NodeServer.js"
```

Added in v1.0.0

## From "./OpenApi.js"

Derivation of `OpenApi` schema from an instance of `Api`.

**Signature**

```ts
export * as OpenApi from "./OpenApi.js"
```

Added in v1.0.0

## From "./Representation.js"

`Representation` is a data structure holding information about how to
serialize and deserialize a server response for a given conten type.

**Signature**

```ts
export * as Representation from "./Representation.js"
```

Added in v1.0.0

## From "./Route.js"

Create @effect/platform/Http/Router `Router`

**Signature**

```ts
export * as Route from "./Route.js"
```

Added in v1.0.0

## From "./RouterBuilder.js"

Build a `Router` satisfying an `Api.Api`.

**Signature**

```ts
export * as RouterBuilder from "./RouterBuilder.js"
```

Added in v1.0.0

## From "./ServerError.js"

Server errors.

**Signature**

```ts
export * as ServerError from "./ServerError.js"
```

Added in v1.0.0

## From "./SwaggerRouter.js"

Create a router serving Swagger files.

**Signature**

```ts
export * as SwaggerRouter from "./SwaggerRouter.js"
```

Added in v1.0.0

## From "./Testing.js"

Testing if the `Server` implementation.

**Signature**

```ts
export * as Testing from "./Testing.js"
```

Added in v1.0.0
