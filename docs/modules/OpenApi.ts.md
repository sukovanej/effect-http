---
title: OpenApi.ts
nav_order: 10
parent: Modules
---

## OpenApi overview

Derivation of `OpenApi` schema from an instance of `Api`.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)

---

# constructors

## make

Generate OpenApi specification for the Api.

**Signature**

```ts
export declare const make: (api: Api.Api) => OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>
```

Added in v1.0.0
