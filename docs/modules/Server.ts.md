---
title: Server.ts
nav_order: 10
parent: Modules
---

## Server overview

Combinators and constructors for server-side implemnetation.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [buildServer](#buildserver)
- [models](#models)
  - [Server (interface)](#server-interface)

---

# constructors

## buildServer

**Signature**

```ts
export declare const buildServer: <R, A extends Api<Endpoint[]>>(serverBuilder: ServerBuilder<R, [], A>) => Server<R, A>
```

Added in v1.0.0

# models

## Server (interface)

**Signature**

```ts
export interface Server<R, A extends Api = Api> {
  api: A
  handlers: readonly ServerHandler<R>[]
  extensions: readonly ServerExtension<R, A['endpoints']>[]
}
```

Added in v1.0.0
