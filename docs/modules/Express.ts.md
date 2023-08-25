---
title: Express.ts
nav_order: 5
parent: Modules
---

## Express overview

Functions in this module perform convertion of a `Server` instance onto
an `Express` application. Use the `listen` to create an express app and
start listening on the given port (3000 by default).

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [express](#express)
  - [listen](#listen)
  - [listenExpress](#listenexpress)
- [models](#models)
  - [ExpressOptions (interface)](#expressoptions-interface)
  - [ListenOptions (interface)](#listenoptions-interface)

---

# combinators

## express

Create express app from the `Server`

**Signature**

```ts
export declare const express: (
  options?: Partial<ExpressOptions>
) => <R>(serverBuilder: ServerBuilder<R, [], Api<Endpoint[]>>) => Effect.Effect<R, unknown, _express.Express>
```

Added in v1.0.0

## listen

Create an express app from the `Server` and start the server

**Signature**

```ts
export declare const listen: (
  options?: Partial<ListenOptions>
) => <R>(serverBuilder: ServerBuilder<R, [], Api<Endpoint[]>>) => Effect.Effect<R, unknown, void>
```

Added in v1.0.0

## listenExpress

Start the server from an express app

**Signature**

```ts
export declare const listenExpress: (
  options?: Partial<ListenOptions>
) => (express: _express.Express) => Effect.Effect<never, unknown, void>
```

Added in v1.0.0

# models

## ExpressOptions (interface)

**Signature**

```ts
export interface ExpressOptions {
  /** Controls whether to expose OpenAPI UI or not. */
  openapiEnabled: boolean

  /** Which path should be the OpenAPI UI exposed on. */
  openapiPath: string

  /** Expose raw openapi.json */
  rawOpenapiJsonEnabled: true
}
```

Added in v1.0.0

## ListenOptions (interface)

**Signature**

```ts
export interface ListenOptions extends ExpressOptions {
  /** Port to listen on
   *
   *  By default, any available port will be used.
   *
   *  @default undefined
   */
  port: number | undefined

  /** Run effect after server starts. */
  onStart?: (server: http.Server) => Effect.Effect<never, any, any>
}
```

Added in v1.0.0
