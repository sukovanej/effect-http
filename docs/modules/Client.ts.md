---
title: Client.ts
nav_order: 2
parent: Modules
---

## Client overview

This module exposes the `client` combinator which accepts an `Api` instance
and it generates a client-side implementation. The generated implementation
is type-safe and guarantees compatibility of the client and server side.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [client](#client)
- [models](#models)
  - [Client (type alias)](#client-type-alias)
  - [ClientOptions (type alias)](#clientoptions-type-alias)

---

# constructors

## client

Derive client implementation from the `Api`

**Signature**

```ts
export declare const client: <A extends any, H extends Record<string, unknown>>(
  baseUrl: URL,
  options?: ClientOptions<H> | undefined
) => (api: A) => Client<A, H>
```

Added in v1.0.0

# models

## Client (type alias)

**Signature**

```ts
export type Client<A extends AnyApi, H> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]['id']]: ClientFunction<
        Es,
        Id,
        MakeHeadersOptionIfAllPartial<
          DropCommonHeaders<EndpointSchemasToInput<SelectEndpointById<Es, Id>['schemas']>, H>
        >
      >
    }>
  : never
```

Added in v1.0.0

## ClientOptions (type alias)

**Signature**

```ts
export type ClientOptions<H extends Record<string, unknown>> = {
  headers: H
}
```

Added in v1.0.0
