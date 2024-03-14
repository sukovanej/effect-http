import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, Client } from "effect-http"

export const api = Api.api().pipe(
  Api.post("test", "/test", {
    response: [{
      status: 400
    }, {
      status: 200,
      content: Schema.string
    }]
  })
)

const client = Client.make(api)

const log200 = (answer: { status: 200 }) => Effect.log(answer)

client
  .test()
  .pipe(Effect.tap(log200))
