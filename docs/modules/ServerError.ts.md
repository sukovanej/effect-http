---
title: ServerError.ts
nav_order: 13
parent: Modules
---

## ServerError overview

Server errors.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [badGatewayError](#badgatewayerror)
  - [badRequest](#badrequest)
  - [conflictError](#conflicterror)
  - [forbiddenError](#forbiddenerror)
  - [gatewayTimeoutError](#gatewaytimeouterror)
  - [internalServerError](#internalservererror)
  - [make](#make)
  - [makeJson](#makejson)
  - [makeText](#maketext)
  - [notFoundError](#notfounderror)
  - [notImplementedError](#notimplementederror)
  - [serviceUnavailableError](#serviceunavailableerror)
  - [tooManyRequestsError](#toomanyrequestserror)
  - [unauthorizedError](#unauthorizederror)
  - [unsupportedMediaTypeError](#unsupportedmediatypeerror)
- [conversions](#conversions)
  - [toServerResponse](#toserverresponse)
- [models](#models)
  - [ServerError (interface)](#servererror-interface)
- [refinements](#refinements)
  - [isServerError](#isservererror)

---

# constructors

## badGatewayError

**Signature**

```ts
export declare const badGatewayError: (body: unknown) => ServerError
```

Added in v1.0.0

## badRequest

**Signature**

```ts
export declare const badRequest: (body: unknown) => ServerError
```

Added in v1.0.0

## conflictError

**Signature**

```ts
export declare const conflictError: (body: unknown) => ServerError
```

Added in v1.0.0

## forbiddenError

**Signature**

```ts
export declare const forbiddenError: (body: unknown) => ServerError
```

Added in v1.0.0

## gatewayTimeoutError

**Signature**

```ts
export declare const gatewayTimeoutError: (body: unknown) => ServerError
```

Added in v1.0.0

## internalServerError

**Signature**

```ts
export declare const internalServerError: (body: unknown) => ServerError
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: (status: number, body?: unknown) => ServerError
```

Added in v1.0.0

## makeJson

**Signature**

```ts
export declare const makeJson: (status: number, json: unknown) => ServerError
```

Added in v1.0.0

## makeText

**Signature**

```ts
export declare const makeText: (status: number, text: string) => ServerError
```

Added in v1.0.0

## notFoundError

**Signature**

```ts
export declare const notFoundError: (body: unknown) => ServerError
```

Added in v1.0.0

## notImplementedError

**Signature**

```ts
export declare const notImplementedError: (body: unknown) => ServerError
```

Added in v1.0.0

## serviceUnavailableError

**Signature**

```ts
export declare const serviceUnavailableError: (body: unknown) => ServerError
```

Added in v1.0.0

## tooManyRequestsError

**Signature**

```ts
export declare const tooManyRequestsError: (body: unknown) => ServerError
```

Added in v1.0.0

## unauthorizedError

**Signature**

```ts
export declare const unauthorizedError: (body: unknown) => ServerError
```

Added in v1.0.0

## unsupportedMediaTypeError

**Signature**

```ts
export declare const unsupportedMediaTypeError: (body: unknown) => ServerError
```

Added in v1.0.0

# conversions

## toServerResponse

**Signature**

```ts
export declare const toServerResponse: (error: ServerError) => ServerResponse.ServerResponse
```

Added in v1.0.0

# models

## ServerError (interface)

**Signature**

```ts
export interface ServerError extends Cause.YieldableError, Pipeable.Pipeable {
  _tag: "ServerError"
  status: number
  text?: string
  json?: unknown
}
```

Added in v1.0.0

# refinements

## isServerError

**Signature**

```ts
export declare const isServerError: (error: unknown) => error is ServerError
```

Added in v1.0.0
