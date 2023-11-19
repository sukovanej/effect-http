---
title: NodeServer.ts
nav_order: 8
parent: Modules
---

## NodeServer overview

Simplified way to run a node server.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [listen](#listen)
- [models](#models)
  - [Options (interface)](#options-interface)

---

# combinators

## listen

**Signature**

```ts
export declare const listen: (
  options?: Partial<Options>
) => <R, E>(
  router: App.Default<R, E>
) => Effect.Effect<
  Exclude<
    Exclude<Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>, SwaggerRouter.SwaggerFiles>,
    Server.Server | Platform.Platform
  >,
  ServeError.ServeError,
  never
>
```

Added in v1.0.0

# models

## Options (interface)

**Signature**

```ts
export interface Options {
  port: number | undefined
}
```

Added in v1.0.0
