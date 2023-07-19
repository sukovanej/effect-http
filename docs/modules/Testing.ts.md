---
title: Testing.ts
nav_order: 12
parent: Modules
---

## Testing overview

Testing if the `Server` implementation.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [testingClient](#testingclient)

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
export declare const testingClient: <R, A extends Api>(server: Server<R, [], A>) => TestingClient<R, A>
```

Added in v1.0.0
