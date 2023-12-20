---
title: ExampleServer.ts
nav_order: 4
parent: Modules
---

## ExampleServer overview

The `exampleServer` function generates a `Server` implementation based
on an instance of `Api`. The listening server will perform all the
request and response validations similarly to a real implementation.

Responses returned from the server are generated randomly using the
response `Schema`.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [handle](#handle)
  - [handleRemaining](#handleremaining)
  - [make](#make)

---

# utils

## handle

Create an example implementation for a single endpoint.

**Signature**

```ts
export declare const handle: <RemainingEndpoints extends Api.Endpoint, Id extends RemainingEndpoints["id"]>(
  id: Id
) => <R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
) => RouterBuilder.RouterBuilder<R, E, Exclude<RemainingEndpoints, { id: Id }>>
```

Added in v1.0.0

## handleRemaining

Create an example implementation for all remaining endpoints.

**Signature**

```ts
export declare const handleRemaining: <RemainingEndpoints extends Api.Endpoint, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
) => RouterBuilder.RouterBuilder<R, E, never>
```

Added in v1.0.0

## make

Generate an example `RouterBuilder` implementation.

**Signature**

```ts
export declare const make: <A extends Api.Api>(api: A) => RouterBuilder.RouterBuilder<never, never, never>
```

Added in v1.0.0
