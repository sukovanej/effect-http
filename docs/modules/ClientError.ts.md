---
title: ClientError.ts
nav_order: 3
parent: Modules
---

## ClientError overview

Models for errors being created on the client side.

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
  - [HttpClientError (interface)](#httpclienterror-interface)
  - [InvalidUrlClientError (interface)](#invalidurlclienterror-interface)
  - [UnexpectedClientError (interface)](#unexpectedclienterror-interface)
  - [ValidationClientError (interface)](#validationclienterror-interface)

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

## HttpClientError (interface)

**Signature**

```ts
export interface HttpClientError {
  _tag: 'HttpClientError'
  statusCode: number
  error: unknown
}
```

Added in v1.0.0

## InvalidUrlClientError (interface)

**Signature**

```ts
export interface InvalidUrlClientError {
  _tag: 'InvalidUrlClientError'
  error: unknown
}
```

Added in v1.0.0

## UnexpectedClientError (interface)

**Signature**

```ts
export interface UnexpectedClientError {
  _tag: 'UnexpectedClientError'
  error: unknown
}
```

Added in v1.0.0

## ValidationClientError (interface)

**Signature**

```ts
export interface ValidationClientError {
  _tag: 'ValidationClientError'
  error: unknown
}
```

Added in v1.0.0
