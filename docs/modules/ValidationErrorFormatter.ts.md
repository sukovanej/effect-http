---
title: ValidationErrorFormatter.ts
nav_order: 18
parent: Modules
---

## ValidationErrorFormatter overview

This module gives the client code using the `effect-http` to modify
how validation errors are formatted when returned the server.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [defaultValidationErrorFormatterServer](#defaultvalidationerrorformatterserver)
  - [formatValidationError](#formatvalidationerror)
  - [setValidationErrorFormatter](#setvalidationerrorformatter)
- [context tags](#context-tags)
  - [ValidationErrorFormatterService](#validationerrorformatterservice)
- [models](#models)
  - [ValidationErrorFormatter (interface)](#validationerrorformatter-interface)
- [refinements](#refinements)
  - [isParseError](#isparseerror)

---

# combinators

## defaultValidationErrorFormatterServer

**Signature**

```ts
export declare const defaultValidationErrorFormatterServer: ValidationErrorFormatter
```

Added in v1.0.0

## formatValidationError

**Signature**

```ts
export declare const formatValidationError: (error: ParseError) => Effect.Effect<never, never, string>
```

Added in v1.0.0

## setValidationErrorFormatter

**Signature**

```ts
export declare const setValidationErrorFormatter: (
  formatter: ValidationErrorFormatter
) => Layer.Layer<never, never, ValidationErrorFormatter>
```

Added in v1.0.0

# context tags

## ValidationErrorFormatterService

**Signature**

```ts
export declare const ValidationErrorFormatterService: Context.Tag<ValidationErrorFormatter, ValidationErrorFormatter>
```

Added in v1.0.0

# models

## ValidationErrorFormatter (interface)

**Signature**

```ts
export interface ValidationErrorFormatter {
  (error: ParseError): string
}
```

Added in v1.0.0

# refinements

## isParseError

**Signature**

```ts
export declare const isParseError: (error: unknown) => error is ParseError
```

Added in v1.0.0
