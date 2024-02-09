# effect-http

## 0.50.5

### Patch Changes

- ff3f49d: Remove `Types.Simplify` on client response type.
- 5d7c516: Improve swagger UI serving. It can be accessed from `/docs`, `/docs/`
  and `/docs/index.html`. If used separately, it takes into account a route prefix.

## 0.50.4

### Patch Changes

- 03a9d8c: Disable keep-alive for the testing client.
- 03a9d8c: Update swagger-ui-dist and schema-openapi.

## 0.50.3

### Patch Changes

- 65e09c5: Update schema-openapi.
- 5b25320: Disable keep-alive for the testing client.

## 0.50.2

### Patch Changes

- fd33667: Update @effect/schema peer dependency.

## 0.50.1

### Patch Changes

- 8cf21d6: Update @effect/platform.

## 0.50.0

### Minor Changes

- 48b6938: Update @effect/schema.

## 0.49.7

### Patch Changes

- 0fe0008: Add `server` OpenAPI option.

## 0.49.6

### Patch Changes

- cf7b958: Fix OpenAPI parameters generations.

## 0.49.5

### Patch Changes

- b8a357e: Support `Schema.union` for OpenAPI parameters.

## 0.49.4

### Patch Changes

- a414555: Update effect.

## 0.49.3

### Patch Changes

- 4f5a138: Update effect.

## 0.49.2

### Patch Changes

- 07bd2ac: Update dependencies.

## 0.49.1

### Patch Changes

- 7b1e612: add real groups for storing options used in openapi generation
- 2730164: Update dependencies.

## 0.49.0

### Minor Changes

- f96ed25: Update @effect/schema.

### Patch Changes

- 7537645: Add deprecated option to endpoint

## 0.48.1

### Patch Changes

- 4c57801: Add `summary` OpenApi option for `Api. @KhraksMamtsov

## 0.48.0

### Minor Changes

- 97e1307: Use raw strings instead of URL. Use @effect/platform query and path parameters.
- 97e1307: Add `enableDocs` RouterBuiler option.

## 0.47.0

### Minor Changes

- fa10e8a: Update effect.

## 0.46.2

### Patch Changes

- 3b4a08c: Update effect + @effect/schema.

## 0.46.1

### Patch Changes

- 2554a22: Updated build setup

## 0.46.0

### Minor Changes

- 3457ae1: Update effect.

## 0.45.2

### Patch Changes

- 27af725: Fix: use `ClientRequestEncoder` for `MockClient`.
- 27af725: Update @effect/platform.

## 0.45.1

### Patch Changes

- cc2dd9b: Add new `ExampleServer.handle` and `ExampleServer.handleRemaining` utils.

## 0.45.0

### Minor Changes

- 47c1fe7: Update @effect/platform.

## 0.44.0

### Minor Changes

- 9e678bd: Update effect.

## 0.43.0

### Minor Changes

- 940165a: Update effect.

## 0.42.3

### Patch Changes

- d47cde5: Fix internal modules imports.
- 139e562: Update dependencies.

## 0.42.2

### Patch Changes

- 3464ad2: Update dependencies.

## 0.42.1

### Patch Changes

- 32147bc: Update effect.

## 0.42.0

### Minor Changes

- 24bce47: User-land content type handling.

  - Add `Representation` module.
  - Update response parsing and encoding so that it uses the `Representation` object to decide on the
    serialization and deserialization of HTTP content.
  - `ServerError` module exposes interface instead of class for the error model.

- 80100bd: Update effect.

## 0.41.0

### Minor Changes

- 57a9122: Update dependencies.

### Patch Changes

- cb7f4df: Update swagger-ui-dist.

## 0.40.1

### Patch Changes

- ea57f51: Make `@effect/platform` a peer dependency.

## 0.40.0

### Minor Changes

- 34a3b5b: Remove `trace` method.
- 34a3b5b: Finish CORS middleware.

## 0.39.1

### Patch Changes

- 49a2efe: Fix CORS middleware.

## 0.39.0

### Minor Changes

- d98d8bc: Refactor `ClientError` module.
- d98d8bc: Add `Testing.makeRaw`.

### Patch Changes

- 15974df: Add @effect/platform-node as an optional dependency.
- d98d8bc: Update dependencies.
- d98d8bc: CORS middleware.

## 0.38.3

### Patch Changes

- a054d92: Make `SwaggerRouter` platform agnostic.

## 0.38.2

### Patch Changes

- 6cb924d: Load platform-node lazily.

## 0.38.1

### Patch Changes

- 5b2b478: Update schema-openapi.
- a74988e: Update @effect/platform.

## 0.38.0

### Minor Changes

- d5af5ff: Allow specifying `ParseOptions` for a `RouterBuilder` request validation.

### Patch Changes

- 139bf95: Update @effect/schema.

## 0.37.2

### Patch Changes

- cf4a7f7: Full OpenApi info can be set when calling the `Api.api`.

## 0.37.1

### Patch Changes

- 1fd4303: Update @effect/platform.

## 0.37.0

### Minor Changes

- 8536f36: **WARNING**: LOT OF BREAKING CHANGES AHEAD

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

- 30d07ce: Update dependencies.

## 0.36.0

### Minor Changes

- 8d4255b: Update effect.

### Patch Changes

- d0a5e94: Fix: testing client works with form data.

## 0.35.1

### Patch Changes

- fdb438c: Update effect.

## 0.35.0

### Minor Changes

- 3da55b7: Update effect.

## 0.34.0

### Minor Changes

- 12bfe12: Update effect.

## 0.33.1

### Patch Changes

- e545f0c: Fix import.

## 0.33.0

### Minor Changes

- 325f0a4: Update effect.
- a65a9b2: Refactor client errors.

## 0.32.2

### Patch Changes

- 7e4546b: Update @effect/platform.

## 0.32.1

### Patch Changes

- 757bd90: Update dependencies.
- bce4f7e: Refactor: rewrite client using @effect/platform.

## 0.32.0

### Minor Changes

- 3211930: Update effect.

## 0.31.4

### Patch Changes

- 5b6d151: Update effect.

## 0.31.3

### Patch Changes

- 42731e2: Update effect.

## 0.31.2

### Patch Changes

- 28ed55b: Update effect dependencies.
- ecca038: Update @effect/schema.

## 0.31.1

### Patch Changes

- 7f57b7d: Update @effect/platform-node.

## 0.31.0

### Minor Changes

- 9a4387d: Update effect.

### Patch Changes

- 9a4387d: Introduce `@effect/platform` Router derivation.

## 0.30.2

### Patch Changes

- 13a9a09: Update dependencies.
- 59d75db: Update /data and /io.

## 0.30.1

### Patch Changes

- a37157e: Fix @effect/io peer dependency version.

## 0.30.0

### Minor Changes

- fd69e9c: Update effect dependencies.

## 0.29.0

### Minor Changes

- 9dd1613: Update effect dependencies.

## 0.28.0

### Minor Changes

- f56d5a9: Expose `/openapi.json`.

## 0.27.5

### Patch Changes

- 43bab8a: Fix testing client - set content-\* headers if body is provided.

## 0.27.4

### Patch Changes

- ab622b0: Update schema-openapi - fixes example server with constrained numbers in schemas.

## 0.27.3

### Patch Changes

- 295d6d6: Update schema-openapi.

## 0.27.2

### Patch Changes

- edb5531: Update dependencies.

## 0.27.1

### Patch Changes

- 4adc5f9: Update schema-openapi.

## 0.27.0

### Minor Changes

- 09af1a2: Make `mockClient` data-first.

### Patch Changes

- 5528872: Handle `FormData` on the server.
- 9e9a9b3: Implement `Pipeable` for `Api` and `ServerBuilder`.
- d964b02: Move `FormData` schema to `Api` module.

## 0.26.1

### Patch Changes

- df37219: Update schema-openapi.

## 0.26.0

### Minor Changes

- db02159: Change /io, /data and /schema to peer dependencies.

## 0.25.0

### Minor Changes

- 2d710d7: Support `FormData` on the client side.

## 0.24.2

### Patch Changes

- 05185c2: Fix exports.
- 122d536: Add readme to dist.

## 0.24.1

### Patch Changes

- 1a86946: Fix build.

## 0.24.0

### Minor Changes

- 95c82c9: Update /io and /schema.

### Patch Changes

- 95c82c9: ESM fix by @vecerek

## 0.23.1

### Patch Changes

- 5e4f71c: Fix client usage in browser. Express related libraries will load lazily. This is rather a quick fix preceding a proper solution.

## 0.23.0

### Minor Changes

- 68749c9: Testing client returns type-safe response object.
- e21ef69: Update /io and /schema.

## 0.22.0

### Minor Changes

- 9e5bc29: Update /data, /io and /schema.

## 0.21.2

### Patch Changes

- 5bcd82c: Update dependencies.

## 0.21.1

### Patch Changes

- d84944e: Update /schema dependencies.
- d301880: Update /data.

## 0.21.0

### Minor Changes

- 71d9a3d: Make `Http.client` data-first.

  Instead of

  ```ts
  const client = pipe(api, Http.client(url, options));
  ```

  use

  ```ts
  const client = Http.client(api, url, options);
  ```

- e0fa6e6: Remove `effect-log` and logging functionality.
- 7ee7ec3: Custom response. Remove possibility to return `Response`.

### Patch Changes

- db40417: Fix OpenApi path string format.
- 368ae52: Make sure path string matches the param schema.

## 0.20.3

### Patch Changes

- 310cb15: Fix optional path parameters.

## 0.20.2

### Patch Changes

- 7ce5cec: Fix OpenApi parameter types.

## 0.20.1

### Patch Changes

- 21a3cff: Fix OpenApi required flag.

## 0.20.0

### Minor Changes

- c24e990: Split server building into two parts.
- b9b8b2b: Change api schemas struture. All request locations are specified using Schema instead of record of Schemas.

## 0.19.0

### Minor Changes

- ff37dfc: Multiple responses, response headers, client input type fixes.

  This release allows to specify different status codes to return different responses and headers.

  ```ts
  const api = pipe(
    Http.api(),
    Http.post("hello", "/hello", {
      response: [
        {
          status: 201,
          content: Schema.number,
        },
        {
          status: 200,
          content: Schema.number,
          headers: {
            "X-Another-200": Schema.NumberFromString,
          },
        },
        {
          status: 204,
          headers: { "X-Another": Schema.string },
        },
      ],
    }),
  );
  ```

  Specified response combinations are propagated to the OpenApi.

  The generated client in case of multiple responses returns an
  object `{ status, content, headers }`, the proper union type is
  generated in that case.

- dbe343f: Derivation of `ResponseUtil` object.

### Patch Changes

- 1dcd434: Update schema-openapi.

## 0.18.0

### Minor Changes

- 693d85e: Example server has precise `Api` type.

### Patch Changes

- 97c23b8: Update /data and /io.

## 0.17.2

### Patch Changes

- 28327db: Update schema-openapi and /schema.

## 0.17.1

### Patch Changes

- dc8d503: Update dependencies.

## 0.17.0

### Minor Changes

- 19a26ab: Update /data and /io.

## 0.16.0

### Minor Changes

- c245afd: Update dependencies.

## 0.15.1

### Patch Changes

- d380340: Update dependencies.

## 0.15.0

### Minor Changes

- 49828cf: Update dependencies.

## 0.14.4

### Patch Changes

- 1431d2e: Update dependencies.

## 0.14.3

### Patch Changes

- 111d2ed: Fix commonjs.

## 0.14.2

### Patch Changes

- 392d0cf: Update dependencies.

## 0.14.1

### Patch Changes

- 8237fff: Fix build.

## 0.14.0

### Minor Changes

- ccd9911: Extensions.

  - added basic auth built-in extension
  - added `OnErrorExtension` extension type
  - added `ServerExtensionOptions` which allow white-/black-listing
    operations for extensions

## 0.13.1

### Patch Changes

- cb022a4: Update dependencies.
- e281dd5: Remove unnecessary files from the build.

## 0.13.0

### Minor Changes

- 5e5ef61: Introduce extensions.
- d704fe0: Testing module.

## 0.12.1

### Patch Changes

- 223e8ea: Update dependencies.

## 0.12.0

### Minor Changes

- 0a66561: Remove `Any*` type variants.

## 0.11.1

### Patch Changes

- 4ba83cf: Update dependencies.

## 0.11.0

### Minor Changes

- 2e0c01f: Add support for descriptions.

  - Descriptions are generated for schemas with `DescriptionAnnotation`.
  - Endpoint methods (`Http.get`, `Http.post`, etc) accept an optional 4th argument with
    description of the operation.

## 0.10.3

### Patch Changes

- d679e96: Update dependencies.

## 0.10.2

### Patch Changes

- 8d8010f: Fix common js imports.

## 0.10.1

### Patch Changes

- a11af53: Remove docs from the package.
- bf5b0bb: Update dependencies.

## 0.10.0

### Minor Changes

- fdde411: Flatten package file structure.
- 1627a6a: Generate API documentation.

### Patch Changes

- d7133fb: Update package.json homepage.

## 0.9.3

### Patch Changes

- 03df92d: Fix imports.

## 0.9.2

### Patch Changes

- e731be3: Update dependencies (effect-log and schema-openapi support esm).

## 0.9.1

### Patch Changes

- 0fc27ef: Update dependencies.

## 0.9.0

### Minor Changes

- 4a60b11: Add esm support.

## 0.8.0

### Minor Changes

- 7812314: Allow client http calls to be interrupted.

### Patch Changes

- 3604908: Update dependencies.

## 0.7.3

### Patch Changes

- cd5baf2: Update dependencies.

## 0.7.2

### Patch Changes

- 114a41f: Update dependencies.

## 0.7.1

### Patch Changes

- fb2ce23: Fix build.

## 0.7.0

### Minor Changes

- 77ee530: Client common headers. Inputs of client operation functions can be ommited if
  there are no required inputs for the request.

## 0.6.4

### Patch Changes

- 69fb81f: Update dependencies. Schema.optionFromNullable doesn't include `undefined`.

## 0.6.3

### Patch Changes

- 04d23cd: Update dependencies
- 4fa28e3: Update dependencies. `schema-openapi` fixes usage of `Schema.optionFromNullable`.
- cb52845: Throw an error when GET endpoint specifies body

## 0.6.2

### Patch Changes

- 81412cc: Use encode for response serialization.

## 0.6.1

### Patch Changes

- 130fdd8: Update dependencies

## 0.6.0

### Minor Changes

- b222abb: Introduce mock client derivation.

### Patch Changes

- aeacd10: Update dependencies

## 0.5.2

### Patch Changes

- 336001c: Fix `/docs` endpoint

## 0.5.1

### Patch Changes

- 325ef5a: Update schema-openapi
- aaf554e: Remove test related files from build
- 6f7060e: Update dependencies

## 0.5.0

### Minor Changes

- c3846a1: Use Fetch API `Request` / `Response` internally.

## 0.4.0

### Minor Changes

- 06e68e4: Replace undici by Fetch API

### Patch Changes

- 3ee7377: Add default express handler with 404 response

## 0.3.0

### Minor Changes

- 922437a: Provide `ValidationErrorFormatter` through the context with default

## 0.2.1

### Patch Changes

- 4521c2f: Propagate Server dependency `R` type to handler.

## 0.2.0

### Minor Changes

- c669452: Response object to enable custom status code and response headers.

### Patch Changes

- 42aa9c6: prevent accidental introduction of duplicate operation ids
- 340e70a: Move general endpoint handling logic to server.

## 0.1.1

### Patch Changes

- 08af565: add effect-log dependency
- 22552ea: Improve server stopping log message

## 0.1.0

### Minor Changes

- 2eb96bb: Rewrite endpoint handling using `Runtime`.

  - `Http.express`, `Http.listen` and new `Http.listenExpress` functions now
    return `Effect` instead of promise.
  - Options object of `Http.express` was extended by `validationErrorFormatter` field
    that configures how are HTTP validation errors formatted.
  - `Http.listen` and `Http.listenExpress` options object was extended by
    `port` and `logger` fields.
  - `Http.setLogger` was removed in favor of the configuration above.
  - `Http.provideService` and `Http.provideLayer` were removed because the context
    is now propagated from the top-level effect. Simply provide the context for the
    app effect instead. Also, scoped services are now guaranteed to be safely released
    when the whole app closes - currently, on SIGTERM and SIGINT signals.

  ```typescript
  pipe(
    server,
    Http.listen({ port: 3000 }),
    Effect.provideLayer(layer),
    Effect.runPromise,
  );
  ```

### Patch Changes

- 12b70ae: ExampleServer internal and public modules

## 0.0.16

### Patch Changes

- 624aa2b: Update effect-log and remove "module" field from package.json
- 6de1bf7: split internal and public modules
- fbb4b9a: OpenAPI configuration options for `Http.express`
- bb16a9a: extend errors

## 0.0.15

### Patch Changes

- e6ff1c5: update dependencies

## 0.0.14

### Patch Changes

- 11e3874: add support for request headers

## 0.0.13

### Patch Changes

- 0c3232f: update dependencies

## 0.0.12

### Patch Changes

- ecceadb: improve error response and logging
- 21b0484: update @effect/schema

## 0.0.11

### Patch Changes

- 768a058: pattern error reporting
- aca1545: fix query and path parameters to enable correct OpenAPI derivation

## 0.0.10

### Patch Changes

- f89fa9a: update dependencies
- 0c8dee2: update deps

## 0.0.9

### Patch Changes

- 80cb3e8: fix client params
- 5337609: improve logger settings

## 0.0.8

### Patch Changes

- af57359: error handling, human-readable error details

## 0.0.7

### Patch Changes

- 9107ac0: fix build
- 06056f1: listening log on startup

## 0.0.6

### Patch Changes

- 76c5300: improve grouping api
- 0f58e68: Input type helper
- 5b682f5: add `Http.setLogger`
- 39b1c3e: Introduce `exampleServer`, move title and version to `Api`

## 0.0.5

### Patch Changes

- 4b7c67a: Fix handling of JSON responses

## 0.0.4

### Patch Changes

- de54069: Fix: provideLayer and provideService

## 0.0.3

### Patch Changes

- bfb9c21: remove log annotations
- 5366eb0: lazy layers

## 0.0.2

### Patch Changes

- 12a731b: api and server
- client

## 0.0.1

### Patch Changes

- Initial release
