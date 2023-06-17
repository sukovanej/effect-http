---
title: Testing.ts
nav_order: 11
parent: Modules
---

## Testing overview

Testing if the `Server` implementation.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [testingClient](#testingclient)
- [models](#models)
  - [TestingClient (type alias)](#testingclient-type-alias)

---

# constructors

## testingClient

Create a testing client for the `Server`. It generates a similar interface
as the `Http.client` but instead of remote Http calls it performs direct
handler invocations and returns a `Response` object.

All the validations and `Request` / `Response` conversions are actually
triggered, the network part is bypassed.

Server dependencies are propagated to the `Effect` context. Thus, if your
server implementation involves the usage of services, you need to
satisfy the conctract in your tests.

**Signature**

```ts
export declare const testingClient: <R, A extends any>(server: any) => Effect.Effect<R, never, TestingClient<A>>
```

Added in v1.0.0

# models

## TestingClient (type alias)

**Signature**

```ts
export type TestingClient<A extends Api> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]['id']]: ClientFunction<
        MakeHeadersOptionIfAllPartial<EndpointSchemasToInput<SelectEndpointById<Es, Id>['schemas']>>
      >
    }>
  : never
```

Added in v1.0.0
