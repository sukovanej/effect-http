---
title: Representation.ts
nav_order: 10
parent: Modules
---

## Representation overview

`Representation` is a data structure holding information about how to
serialize and deserialize a server response for a given conten type.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
- [errors](#errors)
  - [RepresentationError (interface)](#representationerror-interface)
- [models](#models)
  - [Representation (interface)](#representation-interface)
- [representations](#representations)
  - [json](#json)
  - [plainText](#plaintext)
- [type id](#type-id)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# constructors

## make

**Signature**

```ts
export declare const make: (fields: Omit<Representation, TypeId>) => Representation
```

Added in v1.0.0

# errors

## RepresentationError (interface)

**Signature**

```ts
export interface RepresentationError extends Cause.YieldableError {
  readonly _tag: "RepresentationError"
  readonly message: string
}
```

Added in v1.0.0

# models

## Representation (interface)

**Signature**

```ts
export interface Representation extends Pipeable.Pipeable {
  readonly [TypeId]: TypeId
  readonly stringify: (input: unknown) => Effect.Effect<never, RepresentationError, string>
  readonly parse: (input: string) => Effect.Effect<never, RepresentationError, unknown>
  contentType: string
}
```

Added in v1.0.0

# representations

## json

**Signature**

```ts
export declare const json: Representation
```

Added in v1.0.0

## plainText

**Signature**

```ts
export declare const plainText: Representation
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
