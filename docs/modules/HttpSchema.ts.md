---
title: HttpSchema.ts
nav_order: 5
parent: Modules
---

## HttpSchema overview

HTTP-specific `@effect/schema` annotations and schemas.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [plainText](#plaintext)
- [content codec](#content-codec)
  - [ContentCodec (interface)](#contentcodec-interface)
  - [ContentCodecAnnotationId](#contentcodecannotationid)
  - [contentCodec](#contentcodec)
  - [getContentCodecAnnotation](#getcontentcodecannotation)
  - [jsonContentCodec](#jsoncontentcodec)
  - [plainTextContentCodec](#plaintextcontentcodec)
- [content type](#content-type)
  - [ContentTypeAnnotationId](#contenttypeannotationid)
  - [contentType](#contenttype)
  - [getContentTypeAnnotation](#getcontenttypeannotation)
- [schemas](#schemas)
  - [FormData](#formdata)
  - [PlainText](#plaintext-1)

---

# combinators

## plainText

**Signature**

```ts
export declare const plainText: <A>(self: Schema.Schema<string, A>) => Schema.Schema<string, A>
```

Added in v1.0.0

# content codec

## ContentCodec (interface)

**Signature**

```ts
export interface ContentCodec<I> {
  encode: (i: I) => Effect.Effect<never, Error, string>
  decode: (i: string) => Effect.Effect<never, Error, I>
}
```

Added in v1.0.0

## ContentCodecAnnotationId

**Signature**

```ts
export declare const ContentCodecAnnotationId: symbol
```

Added in v1.0.0

## contentCodec

**Signature**

```ts
export declare const contentCodec: <I>(value: ContentCodec<I>) => <A>(self: Schema.Schema<I, A>) => Schema.Schema<I, A>
```

Added in v1.0.0

## getContentCodecAnnotation

**Signature**

```ts
export declare const getContentCodecAnnotation: <I, A>(self: Schema.Schema<I, A>) => Option.Option<ContentCodec<I>>
```

Added in v1.0.0

## jsonContentCodec

**Signature**

```ts
export declare const jsonContentCodec: ContentCodec<unknown>
```

Added in v1.0.0

## plainTextContentCodec

**Signature**

```ts
export declare const plainTextContentCodec: ContentCodec<string>
```

Added in v1.0.0

# content type

## ContentTypeAnnotationId

**Signature**

```ts
export declare const ContentTypeAnnotationId: symbol
```

Added in v1.0.0

## contentType

**Signature**

```ts
export declare const contentType: (value: string) => <I, A>(self: Schema.Schema<I, A>) => Schema.Schema<I, A>
```

Added in v1.0.0

## getContentTypeAnnotation

**Signature**

```ts
export declare const getContentTypeAnnotation: <I, A>(self: Schema.Schema<I, A>) => Option.Option<string>
```

Added in v1.0.0

# schemas

## FormData

**Signature**

```ts
export declare const FormData: Schema.Schema<FormData, FormData>
```

Added in v1.0.0

## PlainText

**Signature**

```ts
export declare const PlainText: Schema.Schema<string, string>
```

Added in v1.0.0
