# effect-http

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
