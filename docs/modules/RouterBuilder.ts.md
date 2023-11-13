---
title: RouterBuilder.ts
nav_order: 11
parent: Modules
---

## RouterBuilder overview

Build a `Router` satisfying an `Api.Api`.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [handle](#handle)
- [getters](#getters)
  - [getRouter](#getrouter)
- [handling](#handling)
  - [handleRaw](#handleraw)
  - [make](#make)
- [mapping](#mapping)
  - [mapRouter](#maprouter)
- [models](#models)
  - [RouterBuilder (interface)](#routerbuilder-interface)

---

# constructors

## handle

Handle an endpoint using a handler function.

**Signature**

```ts
export declare const handle: <R2, E2, RemainingEndpoints extends Api.Endpoint, Id extends RemainingEndpoints['id']>(
  id: Id,
  fn: Route.HandlerFunction<Extract<RemainingEndpoints, { id: Id }>, R2, E2>
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
) => RouterBuilder<
  | Exclude<R2, Router.RouteContext | ServerRequest.ServerRequest>
  | Exclude<R1, Router.RouteContext | ServerRequest.ServerRequest>,
  E1 | Exclude<E2, ServerError.ServerError>,
  Exclude<RemainingEndpoints, { id: Id }>
>
```

Added in v1.0.0

# getters

## getRouter

Handle an endpoint using a raw `Router.Route.Handler`.

**Signature**

```ts
export declare const getRouter: <R, E>(builder: RouterBuilder<R, E, any>) => Router.Router<R, E>
```

Added in v1.0.0

# handling

## handleRaw

Handle an endpoint using a raw `Router.Route.Handler`.

**Signature**

```ts
export declare const handleRaw: <R2, E2, RemainingEndpoints extends Api.Endpoint, Id extends RemainingEndpoints['id']>(
  id: Id,
  handler: Router.Route.Handler<R2, E2>
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
) => RouterBuilder<
  | Exclude<R2, Router.RouteContext | ServerRequest.ServerRequest>
  | Exclude<R1, Router.RouteContext | ServerRequest.ServerRequest>,
  E2 | E1,
  Exclude<RemainingEndpoints, { id: Id }>
>
```

Added in v1.0.0

## make

Create a new unimplemeted `RouterBuilder` from an `Api`.

**Signature**

```ts
export declare const make: <Api extends Api.Api<Api.Endpoint>>(
  api: Api
) => RouterBuilder<never, never, Api['endpoints'][number]>
```

Added in v1.0.0

# mapping

## mapRouter

Handle an endpoint using a raw `Router.Route.Handler`.

**Signature**

```ts
export declare const mapRouter: <R1, R2, E1, E2, RemainingEndpoints extends Api.Endpoint>(
  fn: (router: Router.Router<R1, E1>) => Router.Router<R2, E2>
) => (builder: RouterBuilder<R1, E1, RemainingEndpoints>) => RouterBuilder<R1 | R2, E1 | E2, RemainingEndpoints>
```

Added in v1.0.0

# models

## RouterBuilder (interface)

**Signature**

```ts
export interface RouterBuilder<R, E, RemainingEndpoints extends Api.Endpoint> extends Pipeable.Pipeable {
  remainingEndpoints: readonly RemainingEndpoints[]
  router: Router.Router<R, E>
}
```

Added in v1.0.0
