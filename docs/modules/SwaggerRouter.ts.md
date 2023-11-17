---
title: SwaggerRouter.ts
nav_order: 13
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
  - [SwaggerFiles (interface)](#swaggerfiles-interface)

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
export declare const SwaggerFilesLive: Layer.Layer<FileSystem.FileSystem | Path.Path, never, SwaggerFiles>
```

Added in v1.0.0

# models

## SwaggerFiles (interface)

**Signature**

```ts
export interface SwaggerFiles {
  files: Record<string, string>
}
```

Added in v1.0.0
