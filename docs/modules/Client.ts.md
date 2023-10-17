---
title: Client.ts
nav_order: 2
parent: Modules
---

## Client overview

This module exposes the `client` combinator which accepts an `Api` instance
and it generates a client-side implementation. The generated implementation
is type-safe and guarantees compatibility of the client and server side.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [client](#client)
  - [endpointClient](#endpointclient)
- [models](#models)
  - [Client (type alias)](#client-type-alias)
  - [ClientOptions (interface)](#clientoptions-interface)

---

# constructors

## client

Derive client implementation from the `Api`

**Signature**

```ts
export declare const client: <
  A extends Api.Api<Api.Endpoint[]>,
  H extends Record<string, unknown> = Record<never, never>
>(
  api: A,
  baseUrl: string | URL,
  options?: ClientOptions<H> | undefined
) => Client<A, H>
```

Added in v1.0.0

## endpointClient

**Signature**

```ts
export declare const endpointClient: <
  A extends Api.Api<Api.Endpoint[]>,
  Id extends A['endpoints'][number]['id'],
  H extends Record<string, unknown>
>(
  id: Id,
  api: A,
  baseUrl: URL | string,
  options?: ClientOptions<H> | undefined
) => ClientFunction<
  A['endpoints'],
  Id,
  MakeHeadersOptionIfAllPartial<
    Types.Simplify<{
      [K in keyof {
        [K in Extract<
          keyof Extract<A['endpoints'][number], { id: Id }>['schemas']['request'],
          RequiredFields<Extract<A['endpoints'][number], { id: Id }>['schemas']['request']>
        >]: SchemaTo<Extract<A['endpoints'][number], { id: Id }>['schemas']['request'][K]>
      }]: K extends 'headers'
        ? Types.Simplify<
            {
              [HK in Extract<
                keyof {
                  [K in Extract<
                    keyof Extract<A['endpoints'][number], { id: Id }>['schemas']['request'],
                    RequiredFields<Extract<A['endpoints'][number], { id: Id }>['schemas']['request']>
                  >]: SchemaTo<Extract<A['endpoints'][number], { id: Id }>['schemas']['request'][K]>
                }[K],
                keyof H
              >]?:
                | {
                    [K in Extract<
                      keyof Extract<A['endpoints'][number], { id: Id }>['schemas']['request'],
                      RequiredFields<Extract<A['endpoints'][number], { id: Id }>['schemas']['request']>
                    >]: SchemaTo<Extract<A['endpoints'][number], { id: Id }>['schemas']['request'][K]>
                  }[K][HK]
                | undefined
            } & Pick<
              {
                [K in Extract<
                  keyof Extract<A['endpoints'][number], { id: Id }>['schemas']['request'],
                  RequiredFields<Extract<A['endpoints'][number], { id: Id }>['schemas']['request']>
                >]: SchemaTo<Extract<A['endpoints'][number], { id: Id }>['schemas']['request'][K]>
              }[K],
              Exclude<
                keyof {
                  [K in Extract<
                    keyof Extract<A['endpoints'][number], { id: Id }>['schemas']['request'],
                    RequiredFields<Extract<A['endpoints'][number], { id: Id }>['schemas']['request']>
                  >]: SchemaTo<Extract<A['endpoints'][number], { id: Id }>['schemas']['request'][K]>
                }[K],
                keyof H
              >
            >
          >
        : {
            [K in Extract<
              keyof Extract<A['endpoints'][number], { id: Id }>['schemas']['request'],
              RequiredFields<Extract<A['endpoints'][number], { id: Id }>['schemas']['request']>
            >]: SchemaTo<Extract<A['endpoints'][number], { id: Id }>['schemas']['request'][K]>
          }[K]
    }>
  >
>
```

Added in v1.0.0

# models

## Client (type alias)

**Signature**

```ts
export type Client<A extends Api.Api, H> = A extends Api.Api<infer Es>
  ? {
      [Id in Es[number]['id']]: EndpointClient<A, Id, H>
    } & Pipeable.Pipeable
  : never
```

Added in v1.0.0

## ClientOptions (interface)

**Signature**

```ts
export interface ClientOptions<H extends Record<string, unknown>> {
  headers: H
}
```

Added in v1.0.0
