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

- [constructors](#constructors)
  - [afterHandlerExtension](#afterhandlerextension)
  - [beforeHandlerExtension](#beforehandlerextension)
- [extensions](#extensions)
  - [accessLogExtension](#accesslogextension)
  - [endpointCallsMetricExtension](#endpointcallsmetricextension)
  - [uuidLogAnnotationExtension](#uuidlogannotationextension)
- [models](#models)
  - [AfterHandlerExtension (type alias)](#afterhandlerextension-type-alias)
  - [BeforeHandlerExtension (type alias)](#beforehandlerextension-type-alias)
  - [Extension (type alias)](#extension-type-alias)

---

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
export type Extension<R> = BeforeHandlerExtension<R> | AfterHandlerExtension<R>
```

Added in v1.0.0
