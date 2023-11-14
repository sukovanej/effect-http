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
  - [make](#make)

---

# constructors

## make

Generate an example Server implementation.

**Signature**

```ts
export declare const make: <A extends Api.Api<Api.Endpoint>>(api: A) => RouterBuilder.RouterBuilder<never, never, never>
```

Added in v1.0.0
