---
title: Route.ts
nav_order: 10
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
  fn: HandlerFunction<Endpoint, R, E>
) => (endpoint: Endpoint) => Router.Route<R, Exclude<E, ServerError.ServerError>>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: <A extends Api.Api<Api.Endpoint[]>, Id extends A['endpoints'][number]['id'], R, E>(
  id: Id,
  fn: HandlerFunction<SelectEndpointById<A['endpoints'], Id>, R, E>
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>>
```

Added in v1.0.0

# models

## HandlerFunction (type alias)

**Signature**

```ts
export type HandlerFunction<En extends Api.Endpoint, R, E> = (
  input: Types.Simplify<EndpointSchemasTo<En['schemas']>['request']>
) => Effect.Effect<R, E, EndpointResponseSchemaTo<En['schemas']['response']>>
```

Added in v1.0.0
