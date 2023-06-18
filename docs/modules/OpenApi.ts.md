---
title: OpenApi.ts
nav_order: 9
parent: Modules
---

## OpenApi overview

Derivation of `OpenApi` schema from an instance of `Api`.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [openApi](#openapi)
- [models](#models)
  - [OpenApiSpecification (type alias)](#openapispecification-type-alias)

---

# constructors

## openApi

Generate OpenApi specification for the Api.

**Signature**

```ts
export declare const openApi: (api: any) => OpenApiSpecification
```

Added in v1.0.0

# models

## OpenApiSpecification (type alias)

**Signature**

```ts
export type OpenApiSpecification = OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType>
```

Added in v1.0.0
