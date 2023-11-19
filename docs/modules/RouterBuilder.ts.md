---
title: RouterBuilder.ts
nav_order: 12
parent: Modules
---

## RouterBuilder overview

Build a `Router` satisfying an `Api.Api`.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [handle](#handle)
- [destructors](#destructors)
  - [build](#build)
  - [buildPartial](#buildpartial)
  - [getRouter](#getrouter)
- [handling](#handling)
  - [handleRaw](#handleraw)
  - [make](#make)
- [mapping](#mapping)
  - [mapRouter](#maprouter)
- [models](#models)
  - [Options (interface)](#options-interface)
  - [RouterBuilder (interface)](#routerbuilder-interface)

---

# constructors

## handle

Handle an endpoint using a handler function.

**Signature**

```ts
export declare const handle: <R2, E2, RemainingEndpoints extends Api.Endpoint, Id extends RemainingEndpoints["id"]>(
  id: Id,
  fn: Route.HandlerFunction<Extract<RemainingEndpoints, { id: Id }>, R2, E2>
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
) => RouterBuilder<
  | Exclude<R2, ServerRequest.ServerRequest | Router.RouteContext>
  | Exclude<R1, ServerRequest.ServerRequest | Router.RouteContext>,
  E1 | Exclude<E2, ServerError.ServerError>,
  Exclude<RemainingEndpoints, { id: Id }>
>
```

Added in v1.0.0

# destructors

## build

Create an `App` instance.

**Signature**

```ts
export declare const build: <R, E>(
  builder: RouterBuilder<R, E, never>
) => App.Default<SwaggerRouter.SwaggerFiles | R, E>
```

Added in v1.0.0

## buildPartial

Create an `App` instance.

Warning: this function doesn't enforce all the endpoints are implemented and
a running server might not conform the given Api spec.

**Signature**

```ts
export declare const buildPartial: <R, E, RemainingEndpoints extends Api.Endpoint>(
  builder: RouterBuilder<R, E, RemainingEndpoints>
) => App.Default<SwaggerRouter.SwaggerFiles | R, E>
```

Added in v1.0.0

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
export declare const handleRaw: <R2, E2, RemainingEndpoints extends Api.Endpoint, Id extends RemainingEndpoints["id"]>(
  id: Id,
  handler: Router.Route.Handler<R2, E2>
) => <R1, E1>(
  builder: RouterBuilder<R1, E1, RemainingEndpoints>
) => RouterBuilder<
  | Exclude<R2, ServerRequest.ServerRequest | Router.RouteContext>
  | Exclude<R1, ServerRequest.ServerRequest | Router.RouteContext>,
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
  api: Api,
  options?: Partial<Options>
) => RouterBuilder<never, never, Api["endpoints"][number]>
```

Added in v1.0.0

# mapping

## mapRouter

Modify the `Router`.

**Signature**

```ts
export declare const mapRouter: <R1, R2, E1, E2, RemainingEndpoints extends Api.Endpoint>(
  fn: (router: Router.Router<R1, E1>) => Router.Router<R2, E2>
) => (builder: RouterBuilder<R1, E1, RemainingEndpoints>) => RouterBuilder<R2, E2, RemainingEndpoints>
```

Added in v1.0.0

# models

## Options (interface)

**Signature**

```ts
export interface Options {
  parseOptions: AST.ParseOptions
}
```

Added in v1.0.0

## RouterBuilder (interface)

**Signature**

```ts
export interface RouterBuilder<R, E, RemainingEndpoints extends Api.Endpoint> extends Pipeable.Pipeable {
  remainingEndpoints: readonly RemainingEndpoints[]
  api: Api.Api
  router: Router.Router<R, E>
  options: Options
}
```

Added in v1.0.0
