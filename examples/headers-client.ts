import { Schema } from "@effect/schema"
import { Effect, pipe, ReadonlyArray } from "effect"
import { Api, Client } from "effect-http"

// Example client triggering the API from `examples/headers.ts`
// Running the script call the `/hello` endpoint 1000k times

export const api = pipe(
  Api.api(),
  Api.post("hello", "/hello", {
    response: Schema.string,
    request: {
      body: Schema.struct({ value: Schema.number }),
      headers: Schema.struct({ "X-Client-Id": Schema.string })
    }
  })
)

const client = Client.make(api, {
  baseUrl: new URL("http://localhost:3000")
})

Effect.all(
  client.hello({ body: { value: 1 }, headers: { "x-client-id": "abc" } }).pipe(
    Effect.flatMap((r) => Effect.logInfo(`Success ${r}`)),
    Effect.catchAll((e) => Effect.logInfo(`Error ${JSON.stringify(e)}`)),
    ReadonlyArray.replicate(1000000)
  )
).pipe(Effect.runPromise)
