---
title: Server.ts
nav_order: 13
parent: Modules
---

## Server overview

Simplified way to run a server.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [serve](#serve)

---

# combinators

## serve

**Signature**

```ts
export declare const serve: <R, E>(
  router: App.Default<R, E>
) => Effect.Effect<
  | Server.Server
  | FileSystem.FileSystem
  | Path.Path
  | Exclude<Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>, SwaggerRouter.SwaggerFiles>,
  ServeError.ServeError,
  never
>
```

Added in v1.0.0
