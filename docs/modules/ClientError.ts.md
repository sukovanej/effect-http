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

- [errors](#errors)
  - [HttpClientError (class)](#httpclienterror-class)
    - [create (static method)](#create-static-method)
  - [RequestEncodeError (class)](#requestencodeerror-class)
    - [fromParseError (static method)](#fromparseerror-static-method)
  - [ResponseError (class)](#responseerror-class)
    - [fromResponseError (static method)](#fromresponseerror-static-method)
  - [ResponseValidationError (class)](#responsevalidationerror-class)
    - [fromParseError (static method)](#fromparseerror-static-method-1)
- [models](#models)
  - [ClientError (type alias)](#clienterror-type-alias)

---

# errors

## HttpClientError (class)

**Signature**

```ts
export declare class HttpClientError
```

Added in v1.0.0

### create (static method)

**Signature**

```ts
static create(error: unknown, status: number)
```

Added in v1.0.0

## RequestEncodeError (class)

**Signature**

```ts
export declare class RequestEncodeError
```

Added in v1.0.0

### fromParseError (static method)

**Signature**

```ts
static fromParseError(location: RequestLocation)
```

Added in v1.0.0

## ResponseError (class)

**Signature**

```ts
export declare class ResponseError
```

Added in v1.0.0

### fromResponseError (static method)

**Signature**

```ts
static fromResponseError(error: PlatformClientError.ResponseError)
```

Added in v1.0.0

## ResponseValidationError (class)

**Signature**

```ts
export declare class ResponseValidationError
```

Added in v1.0.0

### fromParseError (static method)

**Signature**

```ts
static fromParseError(location: RequestLocation)
```

Added in v1.0.0

# models

## ClientError (type alias)

**Signature**

```ts
export type ClientError = HttpClientError | ResponseValidationError | RequestEncodeError | ResponseError
```

Added in v1.0.0
