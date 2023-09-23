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

- [constants](#constants)
  - [API_ERROR_TAGS](#api_error_tags)
  - [API_STATUS_CODES](#api_status_codes)
- [constructors](#constructors)
  - [badGatewayError](#badgatewayerror)
  - [conflictError](#conflicterror)
  - [forbiddenError](#forbiddenerror)
  - [gatewayTimeoutError](#gatewaytimeouterror)
  - [internalServerError](#internalservererror)
  - [invalidBodyError](#invalidbodyerror)
  - [invalidHeadersError](#invalidheaderserror)
  - [invalidParamsError](#invalidparamserror)
  - [invalidQueryError](#invalidqueryerror)
  - [invalidResponseError](#invalidresponseerror)
  - [notFoundError](#notfounderror)
  - [notImplementedError](#notimplementederror)
  - [serviceUnavailableError](#serviceunavailableerror)
  - [tooManyRequestsError](#toomanyrequestserror)
  - [unauthorizedError](#unauthorizederror)
  - [unsupportedMediaTypeError](#unsupportedmediatypeerror)
- [models](#models)
  - [ApiClientError (type alias)](#apiclienterror-type-alias)
  - [ApiError (type alias)](#apierror-type-alias)
  - [ApiServerError (type alias)](#apiservererror-type-alias)
  - [BadGatewayError (interface)](#badgatewayerror-interface)
  - [ConflictError (interface)](#conflicterror-interface)
  - [ForbiddenError (interface)](#forbiddenerror-interface)
  - [GatewayTimeoutError (interface)](#gatewaytimeouterror-interface)
  - [InternalServerError (interface)](#internalservererror-interface)
  - [InvalidBodyError (interface)](#invalidbodyerror-interface)
  - [InvalidHeadersError (interface)](#invalidheaderserror-interface)
  - [InvalidParamsError (interface)](#invalidparamserror-interface)
  - [InvalidQueryError (interface)](#invalidqueryerror-interface)
  - [InvalidResponseError (interface)](#invalidresponseerror-interface)
  - [NotFoundError (interface)](#notfounderror-interface)
  - [NotImplementedError (interface)](#notimplementederror-interface)
  - [ServiceUnavailableError (interface)](#serviceunavailableerror-interface)
  - [TooManyRequestsError (interface)](#toomanyrequestserror-interface)
  - [UnauthorizedError (interface)](#unauthorizederror-interface)
  - [UnsupportedMediaTypeError (interface)](#unsupportedmediatypeerror-interface)
- [refinements](#refinements)
  - [isApiError](#isapierror)
  - [isBadGatewayError](#isbadgatewayerror)
  - [isConflictError](#isconflicterror)
  - [isForbiddenError](#isforbiddenerror)
  - [isGatewayTimeoutError](#isgatewaytimeouterror)
  - [isInternalServerError](#isinternalservererror)
  - [isInvalidBodyError](#isinvalidbodyerror)
  - [isInvalidHeadersError](#isinvalidheaderserror)
  - [isInvalidParamsError](#isinvalidparamserror)
  - [isInvalidQueryError](#isinvalidqueryerror)
  - [isInvalidResponseError](#isinvalidresponseerror)
  - [isNotFoundError](#isnotfounderror)
  - [isNotImplementedError](#isnotimplementederror)
  - [isServiceUnavailableError](#isserviceunavailableerror)
  - [isTooManyRequestsError](#istoomanyrequestserror)
  - [isUnauthorizedError](#isunauthorizederror)
  - [isUnsupportedMediaTypeError](#isunsupportedmediatypeerror)

---

# constants

## API_ERROR_TAGS

**Signature**

```ts
export declare const API_ERROR_TAGS: string[]
```

Added in v1.0.0

## API_STATUS_CODES

**Signature**

```ts
export declare const API_STATUS_CODES: Record<
  | 'InvalidQueryError'
  | 'InvalidParamsError'
  | 'InvalidBodyError'
  | 'InvalidHeadersError'
  | 'UnauthorizedError'
  | 'ForbiddenError'
  | 'NotFoundError'
  | 'ConflictError'
  | 'UnsupportedMediaTypeError'
  | 'TooManyRequestsError'
  | 'InvalidResponseError'
  | 'InternalServerError'
  | 'NotImplementedError'
  | 'BadGatewayError'
  | 'ServiceUnavailableError'
  | 'GatewayTimeoutError',
  number
>
```

Added in v1.0.0

# constructors

## badGatewayError

502 Bad Gateway - invalid response from the upstream server

**Signature**

```ts
export declare const badGatewayError: (error: unknown) => BadGatewayError
```

Added in v1.0.0

## conflictError

409 Conflict - request conflicts with the current state of the server

**Signature**

```ts
export declare const conflictError: (error: unknown) => ConflictError
```

Added in v1.0.0

## forbiddenError

403 Forbidden - authorization failure

**Signature**

```ts
export declare const forbiddenError: (error: unknown) => ForbiddenError
```

Added in v1.0.0

## gatewayTimeoutError

504 Service Unavailable - request timeout from the upstream server

**Signature**

```ts
export declare const gatewayTimeoutError: (error: unknown) => GatewayTimeoutError
```

Added in v1.0.0

## internalServerError

500 Internal Server Error - internal server error

**Signature**

```ts
export declare const internalServerError: (error: unknown) => InternalServerError
```

Added in v1.0.0

## invalidBodyError

400 Bad Request - request body validation failed

**Signature**

```ts
export declare const invalidBodyError: (error: unknown) => InvalidBodyError
```

Added in v1.0.0

## invalidHeadersError

400 Bad Request - request headers validation failed

**Signature**

```ts
export declare const invalidHeadersError: (error: unknown) => InvalidHeadersError
```

Added in v1.0.0

## invalidParamsError

400 Bad Request - path parameters validation failed

**Signature**

```ts
export declare const invalidParamsError: (error: unknown) => InvalidParamsError
```

Added in v1.0.0

## invalidQueryError

400 Bad Request - query parameters validation failed

**Signature**

```ts
export declare const invalidQueryError: (error: unknown) => InvalidQueryError
```

Added in v1.0.0

## invalidResponseError

500 Internal Server Error - response validation failed

**Signature**

```ts
export declare const invalidResponseError: (error: unknown) => InvalidResponseError
```

Added in v1.0.0

## notFoundError

404 Not Found - cannot find the requested resource

**Signature**

```ts
export declare const notFoundError: (error: unknown) => NotFoundError
```

Added in v1.0.0

## notImplementedError

501 Not Implemented - functionality to fulfill the request is not supported

**Signature**

```ts
export declare const notImplementedError: (error: unknown) => NotImplementedError
```

Added in v1.0.0

## serviceUnavailableError

503 Service Unavailable - server is not ready to handle the request

**Signature**

```ts
export declare const serviceUnavailableError: (error: unknown) => ServiceUnavailableError
```

Added in v1.0.0

## tooManyRequestsError

429 Too Many Requests - the user has sent too many requests in a given amount of time

**Signature**

```ts
export declare const tooManyRequestsError: (error: unknown) => TooManyRequestsError
```

Added in v1.0.0

## unauthorizedError

401 Unauthorized - invalid authentication credentials

**Signature**

```ts
export declare const unauthorizedError: (error: unknown) => UnauthorizedError
```

Added in v1.0.0

## unsupportedMediaTypeError

415 Unsupported Media Type - unsupported payload format

**Signature**

```ts
export declare const unsupportedMediaTypeError: (error: unknown) => UnsupportedMediaTypeError
```

Added in v1.0.0

# models

## ApiClientError (type alias)

**Signature**

```ts
export type ApiClientError =
  | InvalidQueryError
  | InvalidParamsError
  | InvalidBodyError
  | InvalidHeadersError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError
  | UnsupportedMediaTypeError
  | TooManyRequestsError
```

Added in v1.0.0

## ApiError (type alias)

**Signature**

```ts
export type ApiError = ApiClientError | ApiServerError
```

Added in v1.0.0

## ApiServerError (type alias)

**Signature**

```ts
export type ApiServerError =
  | InvalidResponseError
  | InternalServerError
  | NotImplementedError
  | BadGatewayError
  | ServiceUnavailableError
  | GatewayTimeoutError
```

Added in v1.0.0

## BadGatewayError (interface)

502 Bad Gateway - invalid response from the upstream server

**Signature**

```ts
export interface BadGatewayError {
  _tag: 'BadGatewayError'
  error: unknown
}
```

Added in v1.0.0

## ConflictError (interface)

409 Conflict - request conflicts with the current state of the server

**Signature**

```ts
export interface ConflictError {
  _tag: 'ConflictError'
  error: unknown
}
```

Added in v1.0.0

## ForbiddenError (interface)

403 Forbidden - authorization failure

**Signature**

```ts
export interface ForbiddenError {
  _tag: 'ForbiddenError'
  error: unknown
}
```

Added in v1.0.0

## GatewayTimeoutError (interface)

504 Service Unavailable - request timeout from the upstream server

**Signature**

```ts
export interface GatewayTimeoutError {
  _tag: 'GatewayTimeoutError'
  error: unknown
}
```

Added in v1.0.0

## InternalServerError (interface)

500 Internal Server Error - internal server error

**Signature**

```ts
export interface InternalServerError {
  _tag: 'InternalServerError'
  error: unknown
}
```

Added in v1.0.0

## InvalidBodyError (interface)

400 Bad Request - request body validation failed

**Signature**

```ts
export interface InvalidBodyError {
  _tag: 'InvalidBodyError'
  error: unknown
}
```

Added in v1.0.0

## InvalidHeadersError (interface)

400 Bad Request - request headers validation failed

**Signature**

```ts
export interface InvalidHeadersError {
  _tag: 'InvalidHeadersError'
  error: unknown
}
```

Added in v1.0.0

## InvalidParamsError (interface)

400 Bad Request - path parameters validation failed

**Signature**

```ts
export interface InvalidParamsError {
  _tag: 'InvalidParamsError'
  error: unknown
}
```

Added in v1.0.0

## InvalidQueryError (interface)

400 Bad Request - query parameters validation failed

**Signature**

```ts
export interface InvalidQueryError {
  _tag: 'InvalidQueryError'
  error: unknown
}
```

Added in v1.0.0

## InvalidResponseError (interface)

500 Internal Server Error - response validation failed

**Signature**

```ts
export interface InvalidResponseError {
  _tag: 'InvalidResponseError'
  error: unknown
}
```

Added in v1.0.0

## NotFoundError (interface)

404 Not Found - cannot find the requested resource

**Signature**

```ts
export interface NotFoundError {
  _tag: 'NotFoundError'
  error: unknown
}
```

Added in v1.0.0

## NotImplementedError (interface)

501 Not Implemented - functionality to fulfill the request is not supported

**Signature**

```ts
export interface NotImplementedError {
  _tag: 'NotImplementedError'
  error: unknown
}
```

Added in v1.0.0

## ServiceUnavailableError (interface)

503 Service Unavailable - server is not ready to handle the request

**Signature**

```ts
export interface ServiceUnavailableError {
  _tag: 'ServiceUnavailableError'
  error: unknown
}
```

Added in v1.0.0

## TooManyRequestsError (interface)

429 Too Many Requests - the user has sent too many requests in a given amount of time

**Signature**

```ts
export interface TooManyRequestsError {
  _tag: 'TooManyRequestsError'
  error: unknown
}
```

Added in v1.0.0

## UnauthorizedError (interface)

401 Unauthorized - invalid authentication credentials

**Signature**

```ts
export interface UnauthorizedError {
  _tag: 'UnauthorizedError'
  error: unknown
}
```

Added in v1.0.0

## UnsupportedMediaTypeError (interface)

415 Unsupported Media Type - unsupported payload format

**Signature**

```ts
export interface UnsupportedMediaTypeError {
  _tag: 'UnsupportedMediaTypeError'
  error: unknown
}
```

Added in v1.0.0

# refinements

## isApiError

**Signature**

```ts
export declare const isApiError: (error: unknown) => error is ApiError
```

Added in v1.0.0

## isBadGatewayError

**Signature**

```ts
export declare const isBadGatewayError: (error: unknown) => error is BadGatewayError
```

Added in v1.0.0

## isConflictError

**Signature**

```ts
export declare const isConflictError: (error: unknown) => error is ConflictError
```

Added in v1.0.0

## isForbiddenError

**Signature**

```ts
export declare const isForbiddenError: (error: unknown) => error is ForbiddenError
```

Added in v1.0.0

## isGatewayTimeoutError

**Signature**

```ts
export declare const isGatewayTimeoutError: (error: unknown) => error is GatewayTimeoutError
```

Added in v1.0.0

## isInternalServerError

**Signature**

```ts
export declare const isInternalServerError: (error: unknown) => error is InternalServerError
```

Added in v1.0.0

## isInvalidBodyError

**Signature**

```ts
export declare const isInvalidBodyError: (error: unknown) => error is InvalidBodyError
```

Added in v1.0.0

## isInvalidHeadersError

**Signature**

```ts
export declare const isInvalidHeadersError: (error: unknown) => error is InvalidHeadersError
```

Added in v1.0.0

## isInvalidParamsError

**Signature**

```ts
export declare const isInvalidParamsError: (error: unknown) => error is InvalidParamsError
```

Added in v1.0.0

## isInvalidQueryError

**Signature**

```ts
export declare const isInvalidQueryError: (error: unknown) => error is InvalidQueryError
```

Added in v1.0.0

## isInvalidResponseError

**Signature**

```ts
export declare const isInvalidResponseError: (error: unknown) => error is InvalidResponseError
```

Added in v1.0.0

## isNotFoundError

**Signature**

```ts
export declare const isNotFoundError: (error: unknown) => error is NotFoundError
```

Added in v1.0.0

## isNotImplementedError

**Signature**

```ts
export declare const isNotImplementedError: (error: unknown) => error is NotImplementedError
```

Added in v1.0.0

## isServiceUnavailableError

**Signature**

```ts
export declare const isServiceUnavailableError: (error: unknown) => error is ServiceUnavailableError
```

Added in v1.0.0

## isTooManyRequestsError

**Signature**

```ts
export declare const isTooManyRequestsError: (error: unknown) => error is TooManyRequestsError
```

Added in v1.0.0

## isUnauthorizedError

**Signature**

```ts
export declare const isUnauthorizedError: (error: unknown) => error is UnauthorizedError
```

Added in v1.0.0

## isUnsupportedMediaTypeError

**Signature**

```ts
export declare const isUnsupportedMediaTypeError: (error: unknown) => error is UnsupportedMediaTypeError
```

Added in v1.0.0
