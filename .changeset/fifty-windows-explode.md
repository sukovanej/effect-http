---
"effect-http": minor
---

User-land content type handling.

- Add `Representation` module.
- Update response parsing and encoding so that it uses the `Representation` object to decide on the
  serialization and deserialization of HTTP content.
- `ServerError` module exposes interface instead of class for the error model.
