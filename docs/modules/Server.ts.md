---
title: Server.ts
nav_order: 9
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
- [models](#models)
  - [AddServerHandle (type alias)](#addserverhandle-type-alias)
  - [ApiToServer (type alias)](#apitoserver-type-alias)
  - [DropEndpoint (type alias)](#dropendpoint-type-alias)
  - [EndpointSchemasToInput (type alias)](#endpointschemastoinput-type-alias)
  - [Handler (type alias)](#handler-type-alias)
  - [HandlerInput (type alias)](#handlerinput-type-alias)
  - [HandlerResponse (type alias)](#handlerresponse-type-alias)
  - [Input (type alias)](#input-type-alias)
  - [InputHandlerFn (type alias)](#inputhandlerfn-type-alias)
  - [ProvideService (type alias)](#provideservice-type-alias)
  - [RemoveIgnoredSchemas (type alias)](#removeignoredschemas-type-alias)
  - [SelectEndpointById (type alias)](#selectendpointbyid-type-alias)
  - [Server (type alias)](#server-type-alias)
  - [ServerId (type alias)](#serverid-type-alias)
  - [ServerUnimplementedIds (type alias)](#serverunimplementedids-type-alias)
- [symbols](#symbols)
  - [ServerId](#serverid)

---

# combinators

## exhaustive

Make sure that all the endpoints are implemented

**Signature**

```ts
export declare const exhaustive: <R, A extends any>(server: Server<R, [], A>) => Server<R, [], A>
```

Added in v1.0.0

## handle

Implement handler for the given operation id.

**Signature**

```ts
export declare const handle: <S extends Server<any, any[], any>, Id extends ServerUnimplementedIds<S>, R>(
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
export declare const server: <A extends any>(api: A) => ApiToServer<A>
```

Added in v1.0.0

# models

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
  fn: (request: Request) => Effect.Effect<R, never, Response>

  endpoint: Endpoint
}
```

Added in v1.0.0

## HandlerInput (type alias)

**Signature**

```ts
export type HandlerInput<Q, P, H, B> = {
  query: Q
  params: P
  headers: H
  body: B
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

## InputHandlerFn (type alias)

**Signature**

```ts
export type InputHandlerFn<E extends Endpoint, R> = (
  input: EndpointSchemasToInput<E['schemas']>
) => Effect.Effect<R, ApiError, HandlerResponse<E['schemas']['response']>>
```

Added in v1.0.0

## ProvideService (type alias)

**Signature**

```ts
export type ProvideService<S extends Server<any>, T extends Context.Tag<any, any>> = S extends Server<infer R, infer E>
  ? Server<Exclude<R, Context.Tag.Identifier<T>>, E>
  : never
```

Added in v1.0.0

## RemoveIgnoredSchemas (type alias)

**Signature**

```ts
export type RemoveIgnoredSchemas<E> = Pick<E, NonIgnoredFields<keyof E, E>>
```

Added in v1.0.0

## SelectEndpointById (type alias)

**Signature**

```ts
export type SelectEndpointById<Es extends Endpoint[], Id> = Extract<Es[number], { id: Id }>
```

Added in v1.0.0

## Server (type alias)

**Signature**

```ts
export type Server<R, UnimplementedEndpoints extends Endpoint[] = Endpoint[], A extends Api = Api> = {
  readonly [ServerId]: {
    readonly _R: (_: never) => R
  }

  _unimplementedEndpoints: UnimplementedEndpoints

  handlers: Handler<R>[]
  api: A
}
```

Added in v1.0.0

## ServerId (type alias)

**Signature**

```ts
export type ServerId = typeof ServerId
```

Added in v1.0.0

## ServerUnimplementedIds (type alias)

**Signature**

```ts
export type ServerUnimplementedIds<S extends Server<any>> = S['_unimplementedEndpoints'][number]['id']
```

Added in v1.0.0

# symbols

## ServerId

**Signature**

```ts
export declare const ServerId: typeof ServerId
```

Added in v1.0.0
