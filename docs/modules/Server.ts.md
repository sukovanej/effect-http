---
title: Server.ts
nav_order: 10
parent: Modules
---

## Server overview

Combinators and constructors for server-side implemnetation.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [exhaustive](#exhaustive)
  - [handle](#handle)
- [constructors](#constructors)
  - [server](#server)
- [extensions](#extensions)
  - [addExtension](#addextension)
  - [prependExtension](#prependextension)
- [models](#models)
  - [Input (type alias)](#input-type-alias)
  - [Server (type alias)](#server-type-alias)
  - [ServerExtension (type alias)](#serverextension-type-alias)
  - [ServerExtensionOptions (type alias)](#serverextensionoptions-type-alias)

---

# combinators

## exhaustive

Make sure that all the endpoints are implemented

**Signature**

```ts
export declare const exhaustive: <R, A extends Api>(server: Server<R, [], A>) => Server<R, [], A>
```

Added in v1.0.0

## handle

Implement handler for the given operation id.

**Signature**

```ts
export declare const handle: <S extends Server<any, Endpoint[], Api>, Id extends ServerUnimplementedIds<S>, R>(
  id: Id,
  fn: InputHandlerFn<Extract<S['unimplementedEndpoints'][number], { id: Id }>, R>
) => (api: S) => AddServerHandle<S, Id, R>
```

Added in v1.0.0

# constructors

## server

Create new unimplemeted `Server` from `Api`.

**Signature**

```ts
export declare const server: <A extends Api>(api: A) => ApiToServer<A>
```

Added in v1.0.0

# extensions

## addExtension

**Signature**

```ts
export declare const addExtension: <R, S extends Server<any, Endpoint[], Api>>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<S['api']['endpoints']>> | undefined
) => (server: S) => AddServerDependency<S, R>
```

Added in v1.0.0

## prependExtension

**Signature**

```ts
export declare const prependExtension: <R, S extends Server<any, Endpoint[], Api>>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<S['api']['endpoints']>> | undefined
) => (server: S) => AddServerDependency<S, R>
```

Added in v1.0.0

# models

## Input (type alias)

Type-helper providing type of a handler input given the type of the
Api `A` and operation id `Id`.

```
const api = pipe(
  Http.api(),
  Http.get("getMilan", "/milan", { response: Schema.string, query: Schema.string })
)

type Api = typeof api;

type GetMilanInput = Http.Input<Api, "getMilan">;
// -> { query: string }
```

**Signature**

```ts
export type Input<A extends Api, Id extends A['endpoints'][number]['id']> = Parameters<
  InputHandlerFn<Extract<A['endpoints'][number], { id: Id }>, never>
>[0]
```

Added in v1.0.0

## Server (type alias)

**Signature**

```ts
export type Server<R, Es extends Endpoint[] = Endpoint[], A extends Api = Api> = {
  unimplementedEndpoints: Es
  handlers: Handler<R>[]
  extensions: ServerExtension<R, A['endpoints']>[]
  api: A
}
```

Added in v1.0.0

## ServerExtension (type alias)

**Signature**

```ts
export type ServerExtension<R, Es extends Endpoint[]> = {
  extension: Extension<R>
  options: ServerExtensionOptions<Es>
}
```

Added in v1.0.0

## ServerExtensionOptions (type alias)

**Signature**

```ts
export type ServerExtensionOptions<Es extends Endpoint[]> = {
  skipOperations: Es[number]['id'][]
  allowOperations: Es[number]['id'][]
}
```

Added in v1.0.0
