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

- [constructors](#constructors)
  - [exampleServer](#exampleserver)

---

# constructors

## exampleServer

Generate an example Server implementation.

**Signature**

```ts
export declare const exampleServer: <A extends Api<Endpoint[]>>(api: A) => ServerBuilder<never, [], A>
```

Added in v1.0.0
