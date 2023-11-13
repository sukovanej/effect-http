---
title: ServerBuilder.ts
nav_order: 13
parent: Modules
---

## ServerBuilder overview

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
  - [ServerBuilder (interface)](#serverbuilder-interface)
  - [ServerBuilderHandler (interface)](#serverbuilderhandler-interface)
  - [ServerExtension (interface)](#serverextension-interface)
  - [ServerExtensionOptions (interface)](#serverextensionoptions-interface)

---

# combinators

## exhaustive

Make sure that all the endpoints are implemented

**Signature**

```ts
export declare const exhaustive: <R, A extends Api<Endpoint>>(
  server: ServerBuilder<R, never, A>
) => ServerBuilder<R, never, A>
```

Added in v1.0.0

## handle

Implement handler for the given operation id.

**Signature**

```ts
export declare const handle: <
  S extends ServerBuilder<any, Endpoint, Api<Endpoint>>,
  Id extends ServerUnimplementedIds<S>,
  R
>(
  id: Id,
  fn: InputServerBuilderHandler<R, Extract<S['unimplementedEndpoints'][number], { id: Id }>>
) => (server: S) => AddServerHandle<S, Id, R>
```

Added in v1.0.0

# constructors

## server

Create new unimplemeted `ServerBuilder` from `Api`.

**Signature**

```ts
export declare const server: <A extends Api<Endpoint>>(api: A) => ApiToServer<A>
```

Added in v1.0.0

# extensions

## addExtension

**Signature**

```ts
export declare const addExtension: <R, S extends ServerBuilder<any, Endpoint, Api<Endpoint>>>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<S['api']['endpoints'][number]>> | undefined
) => (server: S) => AddServerDependency<S, R>
```

Added in v1.0.0

## prependExtension

**Signature**

```ts
export declare const prependExtension: <R, S extends ServerBuilder<any, Endpoint, Api<Endpoint>>>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<S['api']['endpoints'][number]>> | undefined
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
  InputServerBuilderHandler<never, Extract<A['endpoints'][number], { id: Id }>>
>[0]
```

Added in v1.0.0

## ServerBuilder (interface)

**Signature**

```ts
export interface ServerBuilder<R, Endpoints extends Endpoint = Endpoint, A extends Api = Api>
  extends Pipeable.Pipeable {
  unimplementedEndpoints: Endpoints[]
  handlers: ServerBuilderHandler<R>[]
  extensions: ServerExtension<R, A['endpoints'][number]>[]
  api: A
}
```

Added in v1.0.0

## ServerBuilderHandler (interface)

**Signature**

```ts
export interface ServerBuilderHandler<R> {
  fn: InputServerBuilderHandler<R, Endpoint>
  endpoint: Endpoint
}
```

Added in v1.0.0

## ServerExtension (interface)

**Signature**

```ts
export interface ServerExtension<R, Es extends Endpoint> {
  extension: Extension<R>
  options: ServerExtensionOptions<Es>
}
```

Added in v1.0.0

## ServerExtensionOptions (interface)

**Signature**

```ts
export interface ServerExtensionOptions<Es extends Endpoint> {
  skipOperations: Es['id'][]
  allowOperations: Es['id'][]
}
```

Added in v1.0.0
