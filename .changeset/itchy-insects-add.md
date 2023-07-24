---
"effect-http": minor
---

Make `Http.client` data-first.

Instead of

```ts
const client = pipe(api, Http.client(url, options));
```

use

```ts
const client = Http.client(api, url, options);
```
