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
- [utils](#utils)
  - [AddServerHandle (type alias)](#addserverhandle-type-alias)
  - [ApiToServer (type alias)](#apitoserver-type-alias)
  - [DropEndpoint (type alias)](#dropendpoint-type-alias)
  - [EndpointSchemasToInput (type alias)](#endpointschemastoinput-type-alias)
  - [Handler (type alias)](#handler-type-alias)
  - [HandlerResponse (type alias)](#handlerresponse-type-alias)
  - [InputHandlerFn (type alias)](#inputhandlerfn-type-alias)
  - [SelectEndpointById (type alias)](#selectendpointbyid-type-alias)
  - [ServerUnimplementedIds (type alias)](#serverunimplementedids-type-alias)

---

# combinators

## exhaustive

Make sure that all the endpoints are implemented

**Signature**

```ts
export declare const exhaustive: <R, A extends Api<Endpoint<string, any, any, any, any, any>[]>>(
  server: Server<R, [], A>
) => Server<R, [], A>
```

Added in v1.0.0

## handle

Implement handler for the given operation id.

**Signature**

```ts
export declare const handle: <
  S extends Server<any, Endpoint<string, any, any, any, any, any>[], Api<Endpoint<string, any, any, any, any, any>[]>>,
  Id extends ServerUnimplementedIds<S>,
  R
>(
  id: Id,
  fn: InputHandlerFn<Extract<S['_unimplementedEndpoints'][number], { id: Id }>, R>
) => (api: S) => AddServerHandle<S, Id, R>
```

Added in v1.0.0

# constructors

## server

Create new unimplemeted `Server` from `Api`.

**Signature**

```ts
export declare const server: <A extends Api<Endpoint<string, any, any, any, any, any>[]>>(api: A) => ApiToServer<A>
```

Added in v1.0.0

# extensions

## addExtension

**Signature**

```ts
export declare const addExtension: <
  R,
  S extends Server<any, Endpoint<string, any, any, any, any, any>[], Api<Endpoint<string, any, any, any, any, any>[]>>
>(
  extension: Extension<R>,
  options?: Partial<ServerExtensionOptions<S['api']['endpoints']>> | undefined
) => (server: S) => AddServerDependency<S, R>
```

Added in v1.0.0

## prependExtension

**Signature**

```ts
export declare const prependExtension: <
  R,
  S extends Server<any, Endpoint<string, any, any, any, any, any>[], Api<Endpoint<string, any, any, any, any, any>[]>>
>(
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

type GetMilanInput = Http.Input<typeof api, "getMilan">
// -> { query: string }
```

**Signature**

```ts
export type Input<A extends Api, Id extends A['endpoints'][number]['id']> = EndpointSchemasToInput<
  Extract<A['endpoints'][number], { id: Id }>['schemas']
>
```

Added in v1.0.0

## Server (type alias)

**Signature**

```ts
export type Server<R, UnimplementedEndpoints extends Endpoint[] = Endpoint[], A extends Api = Api> = {
  _unimplementedEndpoints: UnimplementedEndpoints

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

# utils

## AddServerHandle (type alias)

**Signature**

```ts
export type AddServerHandle<S extends Server<any>, Id extends ServerUnimplementedIds<S>, R> = S extends Server<
  infer R0,
  infer E,
  infer A
>
  ? Server<R0 | R, DropEndpoint<E, Id>, A>
  : never
```

Added in v1.0.0

## ApiToServer (type alias)

**Signature**

```ts
export type ApiToServer<A extends Api> = A extends Api<infer Es> ? Server<never, Es, A> : never
```

Added in v1.0.0

## DropEndpoint (type alias)

**Signature**

```ts
export type DropEndpoint<Es extends Endpoint[], Id extends string> = Es extends [infer First, ...infer Rest]
  ? First extends { id: Id }
    ? Rest
    : [First, ...(Rest extends Endpoint[] ? DropEndpoint<Rest, Id> : never)]
  : []
```

Added in v1.0.0

## EndpointSchemasToInput (type alias)

**Signature**

```ts
export type EndpointSchemasToInput<E extends Endpoint['schemas']> = Schema.Spread<
  SchemaStructTo<RemoveIgnoredSchemas<Omit<E, 'response'>>>
>
```

Added in v1.0.0

## Handler (type alias)

**Signature**

```ts
export type Handler<R = any> = {
  fn: (request: Request) => Effect.Effect<R, unknown, Response>

  endpoint: Endpoint
}
```

Added in v1.0.0

## HandlerResponse (type alias)

**Signature**

```ts
export type HandlerResponse<S extends Schema.Schema<any, any>> = S extends Schema.Schema<any, infer Body>
  ? Response | Body
  : never
```

Added in v1.0.0

## InputHandlerFn (type alias)

**Signature**

```ts
export type InputHandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E['schemas']>
) => Effect.Effect<R, ApiError, HandlerResponse<E['schemas']['response']>>
```

Added in v1.0.0

## SelectEndpointById (type alias)

**Signature**

```ts
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<Es[number], { id: Id }>
```

Added in v1.0.0

## ServerUnimplementedIds (type alias)

**Signature**

```ts
export type ServerUnimplementedIds<S extends Server<any>> = S['_unimplementedEndpoints'][number]['id']
```

Added in v1.0.0
