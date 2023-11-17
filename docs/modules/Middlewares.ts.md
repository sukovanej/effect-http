---
title: Middlewares.ts
nav_order: 6
parent: Modules
---

## Middlewares overview

Mechanism for extendning behaviour of all handlers on the server.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [authorization](#authorization)
  - [basicAuth](#basicauth)
  - [cors](#cors)
- [logging](#logging)
  - [accessLog](#accesslog)
  - [errorLog](#errorlog)
  - [uuidLogAnnotation](#uuidlogannotation)
- [metrics](#metrics)
  - [endpointCallsMetric](#endpointcallsmetric)
- [models](#models)
  - [BasicAuthCredentials (interface)](#basicauthcredentials-interface)
  - [CorsOptions (interface)](#corsoptions-interface)

---

# authorization

## basicAuth

Basic auth middleware.

**Signature**

```ts
export declare const basicAuth: <R2, _>(
  checkCredentials: (credentials: BasicAuthCredentials) => Effect.Effect<R2, ServerError.ServerError, _>,
  options?: Partial<{ headerName: string; skipPaths: readonly string[] }>
) => <R1, E>(app: App.Default<R1, E>) => App.Default<R2 | R1, E>
```

Added in v1.0.0

## cors

Basic auth middleware.

**Signature**

```ts
export declare const cors: (options?: Partial<CorsOptions>) => <R, E>(app: App.Default<R, E>) => App.Default<R, E>
```

Added in v1.0.0

# logging

## accessLog

Add access logs for handled requests. The log runs before each request.
Optionally configure log level using the first argument. The default log level
is `Debug`.

**Signature**

```ts
export declare const accessLog: (
  level?: "Info" | "Warning" | "Debug"
) => <R, E>(app: App.Default<R, E>) => App.Default<R, E>
```

Added in v1.0.0

## errorLog

Logs out a handler failure.

**Signature**

```ts
export declare const errorLog: <R, E>(app: App.Default<R, E>) => App.Default<R, E>
```

Added in v1.0.0

## uuidLogAnnotation

Annotate request logs using generated UUID. The default annotation key is `requestId`.
The annotation key is configurable using the first argument.

Note that in order to apply the annotation also for access logging, you should
make sure the `accessLog` middleware is plugged after the `uuidLogAnnotation`.

**Signature**

```ts
export declare const uuidLogAnnotation: (
  logAnnotationKey?: string
) => <R, E>(app: App.Default<R, E>) => App.Default<R, E>
```

Added in v1.0.0

# metrics

## endpointCallsMetric

Measure how many times each endpoint was called in a
`server.endpoint_calls` counter metrics.

**Signature**

```ts
export declare const endpointCallsMetric: () => <R, E>(app: App.Default<R, E>) => App.Default<R, E>
```

Added in v1.0.0

# models

## BasicAuthCredentials (interface)

**Signature**

```ts
export interface BasicAuthCredentials {
  user: string
  password: string
}
```

Added in v1.0.0

## CorsOptions (interface)

**Signature**

```ts
export interface CorsOptions {
  origin: string | readonly string[]
  methods: string | readonly string[]
  crendetials: boolean
  // TODO: allowed headers, exposed headers, max age
}
```

Added in v1.0.0
