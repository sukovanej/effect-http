---
title: Utils.ts
nav_order: 14
parent: Modules
---

## Utils overview

Derivation of utilities.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [responseUtil](#responseutil)

---

# utils

## responseUtil

Derive utility object with methods enabling type-safe response object creation.

**Signature**

```ts
export declare const responseUtil: <A extends Api<Endpoint[]>, Id extends A['endpoints'][number]['id']>(
  api: A,
  id: Id
) => Schema.Spread<
  NormalizedSchemasByIdToResponseUtils<SchemasByIdFromApi<Extract<A['endpoints'][number], { id: Id }>>>
>
```

Added in v1.0.0
