---
title: Client/Errors.ts
nav_order: 4
parent: Modules
---

## Errors overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [httpClientError](#httpclienterror)
  - [invalidUrlError](#invalidurlerror)
  - [unexpectedClientError](#unexpectedclienterror)
  - [validationClientError](#validationclienterror)
- [models](#models)
  - [ClientError (type alias)](#clienterror-type-alias)
  - [HttpClientError (type alias)](#httpclienterror-type-alias)
  - [InvalidUrlClientError (type alias)](#invalidurlclienterror-type-alias)
  - [UnexpectedClientError (type alias)](#unexpectedclienterror-type-alias)
  - [ValidationClientError (type alias)](#validationclienterror-type-alias)

---

# constructors

## httpClientError

**Signature**

```ts
export declare const httpClientError: (error: unknown, statusCode: number) => HttpClientError
```

Added in v1.0.0

## invalidUrlError

**Signature**

```ts
export declare const invalidUrlError: (error: unknown) => InvalidUrlClientError
```

Added in v1.0.0

## unexpectedClientError

**Signature**

```ts
export declare const unexpectedClientError: (error: unknown) => UnexpectedClientError
```

Added in v1.0.0

## validationClientError

**Signature**

```ts
export declare const validationClientError: (error: unknown) => ValidationClientError
```

Added in v1.0.0

# models

## ClientError (type alias)

**Signature**

```ts
export type ClientError = InvalidUrlClientError | HttpClientError | ValidationClientError | UnexpectedClientError
```

Added in v1.0.0

## HttpClientError (type alias)

**Signature**

```ts
export type HttpClientError = {
  _tag: 'HttpClientError'
  statusCode: number
  error: unknown
}
```

Added in v1.0.0

## InvalidUrlClientError (type alias)

**Signature**

```ts
export type InvalidUrlClientError = {
  _tag: 'InvalidUrlClientError'
  error: unknown
}
```

Added in v1.0.0

## UnexpectedClientError (type alias)

**Signature**

```ts
export type UnexpectedClientError = {
  _tag: 'UnexpectedClientError'
  error: unknown
}
```

Added in v1.0.0

## ValidationClientError (type alias)

**Signature**

```ts
export type ValidationClientError = {
  _tag: 'ValidationClientError'
  error: unknown
}
```

Added in v1.0.0
