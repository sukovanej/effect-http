import { Schema } from "@effect/schema"
import { Array, Effect, pipe } from "effect"
import { Api, Client } from "effect-http"

// Example client triggering the API from `examples/headers.ts`
// Running the script call the `/hello` endpoint 1000k times

export const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestBody(Schema.Struct({ value: Schema.Number })),
      Api.setRequestHeaders(Schema.Struct({ "x-client-id": Schema.String }))
    )
  )
)

const client = Client.make(api, { baseUrl: "http://localhost:3000" })

Effect.all(
  client.hello({ body: { value: 1 }, headers: { "x-client-id": "abc" } }).pipe(
    Effect.flatMap((r) => Effect.logInfo(`Success ${r}`)),
    Effect.catchAll((e) => Effect.logInfo(`Error ${JSON.stringify(e)}`)),
    Array.replicate(1000000)
  )
).pipe(Effect.scoped, Effect.runFork)
