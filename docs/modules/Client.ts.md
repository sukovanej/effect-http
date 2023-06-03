---
title: Client.ts
nav_order: 2
parent: Modules
---

## Client overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [client](#client)
- [error constructors](#error-constructors)
  - [httpClientError](#httpclienterror)
  - [invalidUrlError](#invalidurlerror)
  - [unexpectedClientError](#unexpectedclienterror)
  - [validationClientError](#validationclienterror)
- [error models](#error-models)
  - [ClientError (type alias)](#clienterror-type-alias)
  - [HttpClientError (type alias)](#httpclienterror-type-alias)
  - [InvalidUrlClientError (type alias)](#invalidurlclienterror-type-alias)
  - [UnexpectedClientError (type alias)](#unexpectedclienterror-type-alias)
  - [ValidationClientError (type alias)](#validationclienterror-type-alias)
- [models](#models)
  - [Client (type alias)](#client-type-alias)
  - [ClientOptions (type alias)](#clientoptions-type-alias)

---

# constructors

## client

Derive client implementation from the `Api`

**Signature**

```ts
export declare const client: <A extends any, H extends Record<string, unknown>>(
  baseUrl: URL,
  options?: ClientOptions<H> | undefined
) => (api: A) => Client<A, H>
```

Added in v1.0.0

# error constructors

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

# error models

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

# models

## Client (type alias)

**Signature**

```ts
export type Client<A extends Api, H> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]['id']]: ClientFunction<
        Es,
        Id,
        MakeHeadersOptionIfAllPartial<
          DropCommonHeaders<EndpointSchemasToInput<SelectEndpointById<Es, Id>['schemas']>, H>
        >
      >
    }>
  : never
```

Added in v1.0.0

## ClientOptions (type alias)

**Signature**

```ts
export type ClientOptions<H extends Record<string, unknown>> = {
  headers: H
}
```

Added in v1.0.0
