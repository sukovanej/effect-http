---
"effect-http": minor
---

**WARNING**: LOT OF BREAKING CHANGES AHEAD

Boht the public API of the package and internals were rewritten.

The `express` dependency was completely discarded. Thus there is no longer support nor
a recommended way to interop with non-effect libraries. Instead, the `effect-http` is
rather meant to be a declarative wrapper and utility library for `@effect/platform/Http`.

## What changed

The library now exposes a set of modules instead of big `Http` reexport of all public
symbols.

- **Api** is the main API for describing HTTP interfaces. From the usage perspective, nothing 
  really changed there.
- **RouterBuilder** exposes the `handle` function and it internally builds a `@effect/platform/Http/Router`
  structure. It's created from `Api.Api` and the type machinery enforces compatibilty of the
  server implementation with the `Api.Api` declaration. The `RouterBuilder.build` builds a
  `@effect/platform/Http/App` instance with OpenAPI and implemented handlers.
- **Route** exposes combinators internally used by `RouterBuilder` but can be used in the
  user-space as well.
- **ClientError** exposes data structures for client-side errors.
- **ServerError** exposes data structures for server-side errors.
- **SwaggerRouter** provides a `@effect/platform` native implementation of a router handling Swagger UI.
- **NodeServer** is a simple utility for running the generated `App`.
- **ExampleServer** generates `RouterBuilder` insteace with dummy responses.
- **OpenApi** gives us the ability to convert `Api.Api` onto an OpenAPI specification. It
  is internally used by `RouterBuilder.build`.
- **Client** generates a client interface for the `Api.Api`.
- **MockClient** also generates a client interface for the `Api.Api` but it return dummy responses.
- **Testing** can be used for testing HTTP API implementations. It is also used internally for `effect-http`
  testing. Now, it actually spaws the real server on a random port and triggers the endpoints throughout
  the network.
- **Middlewares** replaces the old `Extension` module. It doesn't expose its own interface and instead
  it only exposes some handy middlewares built directly for `@effect/platform/Http/Middleware`.

OpenAPI spec now enables components using a `Schema.identifier` - by @arnonym.

## What was removed

- `ResponseUtil` utility
- `Http.Input` type utility

Please refer to the README and examples.
