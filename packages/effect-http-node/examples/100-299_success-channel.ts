import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, ApiResponse, Client } from "effect-http"

export const api = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(
      Api.setResponseBody(Schema.String),
      Api.addResponse(ApiResponse.make(400))
    )
  )
)

const client = Client.make(api)

const log200 = (answer: string) => Effect.log(answer)

client.test({}).pipe((x) => x, Effect.tap(log200))
