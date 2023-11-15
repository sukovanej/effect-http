---
title: Testing.ts
nav_order: 14
parent: Modules
---

## Testing overview

Testing if the `Server` implementation.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)

---

# constructors

## make

Create a testing client for the `Server`.

**Signature**

```ts
export declare const make: <R, E, Endpoints extends Api.Endpoint>(
  app: App.Default<R | SwaggerRouter.SwaggerFiles, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>
) => Effect.Effect<
  | Scope.Scope
  | Exclude<
      Exclude<Exclude<R, ServerRequest.ServerRequest>, PlatformNodeServer.Server | Platform.Platform>,
      SwaggerRouter.SwaggerFiles
    >,
  never,
  Client.Client<Endpoints>
>
```

Added in v1.0.0
