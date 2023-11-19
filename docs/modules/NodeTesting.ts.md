---
title: NodeTesting.ts
nav_order: 9
parent: Modules
---

## NodeTesting overview

Testing if the `Server` implementation.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
  - [makeRaw](#makeraw)

---

# constructors

## make

Create a testing client for the `Server`.

**Signature**

```ts
export declare const make: <R, E, Endpoints extends Api.Endpoint>(
  app: App.Default<R, E>,
  api: Api.Api<Endpoints>,
  options?: Partial<Client.Options>
) => Effect.Effect<
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>, SwaggerRouter.SwaggerFiles>,
        SwaggerRouter.SwaggerFiles
      >,
      Server.Server | Platform.Platform
    >,
  never,
  Client.Client<Endpoints>
>
```

Added in v1.0.0

## makeRaw

Create a testing client for the `Server`. Instead of the `Client.Client` interface
it returns a raw _@effect/platform/Http/Client_ `Client` with base url set.

**Signature**

```ts
export declare const makeRaw: <R, E>(
  app: App.Default<R, E>
) => Effect.Effect<
  | Scope.Scope
  | Exclude<
      Exclude<
        Exclude<Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>, SwaggerRouter.SwaggerFiles>,
        SwaggerRouter.SwaggerFiles
      >,
      Server.Server | Platform.Platform
    >,
  never,
  PlatformClient.Client<never, PlatformClientError.HttpClientError, ClientResponse.ClientResponse>
>
```

Added in v1.0.0
