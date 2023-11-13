---
title: Utils.ts
nav_order: 17
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
export declare const responseUtil: <E extends Api.Endpoint>(
  endpoint: E
) => Types.Simplify<NormalizedSchemasByIdToResponseUtils<SchemasByIdFromApi<E>>>
```

Added in v1.0.0
