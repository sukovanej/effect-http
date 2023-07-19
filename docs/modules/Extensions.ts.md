---
title: Extensions.ts
nav_order: 6
parent: Modules
---

## Extensions overview

Mechanism for extendning behaviour of all handlers on the server.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [basic auth extension](#basic-auth-extension)
  - [BasicAuthCredentials (type alias)](#basicauthcredentials-type-alias)
  - [basicAuthExtension](#basicauthextension)
- [constructors](#constructors)
  - [afterHandlerExtension](#afterhandlerextension)
  - [beforeHandlerExtension](#beforehandlerextension)
  - [onHandlerErrorExtension](#onhandlererrorextension)
- [extensions](#extensions)
  - [accessLogExtension](#accesslogextension)
  - [endpointCallsMetricExtension](#endpointcallsmetricextension)
  - [errorLogExtension](#errorlogextension)
  - [uuidLogAnnotationExtension](#uuidlogannotationextension)
- [models](#models)
  - [AfterHandlerExtension (type alias)](#afterhandlerextension-type-alias)
  - [BeforeHandlerExtension (type alias)](#beforehandlerextension-type-alias)
  - [Extension (type alias)](#extension-type-alias)
  - [OnErrorExtension (type alias)](#onerrorextension-type-alias)

---

# basic auth extension

## BasicAuthCredentials (type alias)

**Signature**

```ts
export type BasicAuthCredentials = {
  user: string
  password: string
}
```

Added in v1.0.0

## basicAuthExtension

**Signature**

```ts
export declare const basicAuthExtension: <R2, _>(
  checkCredentials: (credentials: BasicAuthCredentials) => Effect.Effect<R2, string, _>,
  headerName?: string
) => BeforeHandlerExtension<R2>
```

Added in v1.0.0

# constructors

## afterHandlerExtension

Create an extension which runs an effect after each successful endpoint handler.

**Signature**

```ts
export declare const afterHandlerExtension: <R>(
  id: string,
  fn: (request: Request, response: Response) => Effect.Effect<R, ApiError, unknown>
) => AfterHandlerExtension<R>
```

Added in v1.0.0

## beforeHandlerExtension

Create an extension which runs an effect before each endpoint handler.

**Signature**

```ts
export declare const beforeHandlerExtension: <R>(
  id: string,
  fn: (request: Request) => Effect.Effect<R, ApiError, unknown>
) => BeforeHandlerExtension<R>
```

Added in v1.0.0

## onHandlerErrorExtension

Create an extension which runs an effect when a handler fails.

**Signature**

```ts
export declare const onHandlerErrorExtension: <R>(
  id: string,
  fn: (request: Request, error: unknown) => Effect.Effect<R, unknown, unknown>
) => OnErrorExtension<R>
```

Added in v1.0.0

# extensions

## accessLogExtension

Add access logs for handled requests. The log runs before each request.
Optionally configure log level using the first argument. The default log level
is `Debug`.

**Signature**

```ts
export declare const accessLogExtension: (level?: 'Info' | 'Warning' | 'Debug') => BeforeHandlerExtension<never>
```

Added in v1.0.0

## endpointCallsMetricExtension

Measure how many times each endpoint was called in a
`server.endpoint_calls` counter metrics.

**Signature**

```ts
export declare const endpointCallsMetricExtension: () => BeforeHandlerExtension<never>
```

Added in v1.0.0

## errorLogExtension

Logs out a handler failure.

**Signature**

```ts
export declare const errorLogExtension: () => OnErrorExtension<never>
```

Added in v1.0.0

## uuidLogAnnotationExtension

Annotate request logs using generated UUID. The default annotation key is `requestId`.
The annotation key is configurable using the first argument.

Note that in order to apply the annotation also for access logging, you should
make sure the `access-log` extension run after the `uuid-log-annotation`. Try
using `Http.prependExtension(Http.uuidLogAnnotationExtension())` if you don't
see the `requestId` log annotation in your access logs.

**Signature**

```ts
export declare const uuidLogAnnotationExtension: (logAnnotationKey?: string) => BeforeHandlerExtension<never>
```

Added in v1.0.0

# models

## AfterHandlerExtension (type alias)

Effect running after handlers.

**Signature**

```ts
export type AfterHandlerExtension<R> = {
  _tag: 'AfterHandlerExtension'
  id: string
  fn: (request: Request, response: Response) => Effect.Effect<R, ApiError, unknown>
}
```

Added in v1.0.0

## BeforeHandlerExtension (type alias)

Effect running before handlers.

**Signature**

```ts
export type BeforeHandlerExtension<R> = {
  _tag: 'BeforeHandlerExtension'
  id: string
  fn: (request: Request) => Effect.Effect<R, ApiError, unknown>
}
```

Added in v1.0.0

## Extension (type alias)

Effects applied for all requests. Safer variant of middlewares.

**Signature**

```ts
export type Extension<R> = BeforeHandlerExtension<R> | AfterHandlerExtension<R> | OnErrorExtension<R>
```

Added in v1.0.0

## OnErrorExtension (type alias)

Effect running after handlers.

**Signature**

```ts
export type OnErrorExtension<R> = {
  _tag: 'OnErrorExtension'
  id: string
  fn: (request: Request, error: unknown) => Effect.Effect<R, unknown, unknown>
}
```

Added in v1.0.0
