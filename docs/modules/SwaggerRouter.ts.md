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
  - [SwaggerFiles (interface)](#swaggerfiles-interface)
- [type id](#type-id)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

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
  [TypeId]: TypeId
  files: Record<string, string>
}
```

Added in v1.0.0

# type id

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0
