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
  - [makeClientSide](#makeclientside)
  - [makeClientSideRequestValidation](#makeclientsiderequestvalidation)
  - [makeClientSideResponseValidation](#makeclientsideresponsevalidation)
  - [makeServerSide](#makeserverside)
- [models](#models)
  - [ClientError (interface)](#clienterror-interface)

---

# constructors

## makeClientSide

**Signature**

```ts
export declare const makeClientSide: (error: unknown, messge?: string) => ClientError
```

Added in v1.0.0

## makeClientSideRequestValidation

**Signature**

```ts
export declare const makeClientSideRequestValidation: (
  location: string
) => (error: ParseResult.ParseError) => ClientError
```

Added in v1.0.0

## makeClientSideResponseValidation

**Signature**

```ts
export declare const makeClientSideResponseValidation: (
  location: string
) => (error: ParseResult.ParseError) => ClientError
```

Added in v1.0.0

## makeServerSide

**Signature**

```ts
export declare const makeServerSide: (error: unknown, status: number, messge?: string) => ClientError
```

Added in v1.0.0

# models

## ClientError (interface)

**Signature**

```ts
export interface ClientError extends Data.YieldableError {
  _tag: "ClientError"
  message: string
  error: unknown
  status?: number
  side: "client" | "server"
}
```

Added in v1.0.0
