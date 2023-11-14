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

- [basic auth](#basic-auth)
  - [basicAuth](#basicauth)
- [basic auth extension](#basic-auth-extension)
  - [BasicAuthCredentials (interface)](#basicauthcredentials-interface)
- [extensions](#extensions)
  - [accessLogExtension](#accesslogextension)
  - [endpointCallsMetricExtension](#endpointcallsmetricextension)
  - [errorLogExtension](#errorlogextension)
  - [uuidLogAnnotationExtension](#uuidlogannotationextension)

---

# basic auth

## basicAuth

Basic auth middleware.

**Signature**

```ts
export declare const basicAuth: <R, _>(
  checkCredentials: (credentials: BasicAuthCredentials) => Effect.Effect<R, ServerError.ServerError, _>,
  options?: Partial<{ headerName: string; skipPaths: readonly string[] }>
) => <R, E>(app: Default<R, E>) => Effect.Effect<ServerRequest.ServerRequest | R | R, E, ServerResponse>
```

Added in v1.0.0

# basic auth extension

## BasicAuthCredentials (interface)

**Signature**

```ts
export interface BasicAuthCredentials {
  user: string
  password: string
}
```

Added in v1.0.0

# extensions

## accessLogExtension

Add access logs for handled requests. The log runs before each request.
Optionally configure log level using the first argument. The default log level
is `Debug`.

**Signature**

```ts
export declare const accessLogExtension: (
  level?: "Info" | "Warning" | "Debug"
) => <R, E>(app: Default<R, E>) => Effect.Effect<ServerRequest.ServerRequest | R, E, ServerResponse>
```

Added in v1.0.0

## endpointCallsMetricExtension

Measure how many times each endpoint was called in a
`server.endpoint_calls` counter metrics.

**Signature**

```ts
export declare const endpointCallsMetricExtension: () => <R, E>(
  app: Default<R, E>
) => Effect.Effect<ServerRequest.ServerRequest | R, E, ServerResponse>
```

Added in v1.0.0

## errorLogExtension

Logs out a handler failure.

**Signature**

```ts
export declare const errorLogExtension: () => <R, E>(
  app: Default<R, E>
) => Effect.Effect<ServerRequest.ServerRequest | R, E, ServerResponse>
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
export declare const uuidLogAnnotationExtension: (
  logAnnotationKey?: string
) => <R, E>(app: Default<R, E>) => Effect.Effect<ServerRequest.ServerRequest | R, E, ServerResponse>
```

Added in v1.0.0
