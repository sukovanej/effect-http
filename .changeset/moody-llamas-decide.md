---
"effect-http": minor
---

Add support for descriptions.

- Descriptions are generated for schemas with `DescriptionAnnotation`.
- Endpoint methods (`Http.get`, `Http.post`, etc) accept an optional 4th argument with
  description of the operation.
