---
title: Route.ts
nav_order: 11
parent: Modules
---

## Route overview

Create @effect/platform/Http/Router `Router`

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [fromEndpoint](#fromendpoint)
  - [make](#make)
- [models](#models)
  - [HandlerFunction (type alias)](#handlerfunction-type-alias)

---

# constructors

## fromEndpoint

**Signature**

```ts
export declare const fromEndpoint: <Endpoint extends Api.Endpoint, R, E>(
  fn: HandlerFunction<Endpoint, R, E>,
  options?: RouterBuilder.Options
) => (endpoint: Endpoint) => Router.Route<R, Exclude<E, ServerError.ServerError>>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: <A extends Api.Api<Api.Endpoint>, Id extends A["endpoints"][number]["id"], R, E>(
  id: Id,
  fn: HandlerFunction<Extract<A["endpoints"][number], { id: Id }>, R, E>,
  options?: RouterBuilder.Options
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>>
```

Added in v1.0.0

# models

## HandlerFunction (type alias)

**Signature**

```ts
export type HandlerFunction<Endpoint extends Api.Endpoint, R, E> = (
  input: Types.Simplify<EndpointSchemasTo<Endpoint["schemas"]>["request"]>
) => Effect.Effect<R, E, EndpointResponseSchemaTo<Endpoint["schemas"]["response"]>>
```

Added in v1.0.0
