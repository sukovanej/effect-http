---
title: Router.ts
nav_order: 10
parent: Modules
---

## Router overview

Create @effect/platform/Http/Router `Router`

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [make](#make)

---

# utils

## make

**Signature**

```ts
export declare const make: <A extends Api.Api<Api.Endpoint[]>, Id extends A['endpoints'][number]['id'], R>(
  id: Id,
  fn: InputFn<SelectEndpointById<A['endpoints'], Id>, R>
) => (api: A) => Router.Route<R, never>
```

Added in v1.0.0
