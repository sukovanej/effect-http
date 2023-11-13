---
title: SwaggerRouter.ts
nav_order: 15
parent: Modules
---

## SwaggerRouter overview

Create a router serving Swagger files.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
- [context](#context)
  - [SwaggerFiles](#swaggerfiles)
  - [SwaggerFilesLive](#swaggerfileslive)
- [models](#models)
  - [SwaggerFiles (type alias)](#swaggerfiles-type-alias)

---

# constructors

## make

**Signature**

```ts
export declare const make: (spec: unknown) => Router.Router<SwaggerFiles, never>
```

Added in v1.0.0

# context

## SwaggerFiles

**Signature**

```ts
export declare const SwaggerFiles: Context.Tag<SwaggerFiles, SwaggerFiles>
```

Added in v1.0.0

## SwaggerFilesLive

**Signature**

```ts
export declare const SwaggerFilesLive: Layer.Layer<never, never, SwaggerFiles>
```

Added in v1.0.0

# models

## SwaggerFiles (type alias)

**Signature**

```ts
export type SwaggerFiles = Record<string, string>
```

Added in v1.0.0
