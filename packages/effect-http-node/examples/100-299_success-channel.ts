import { Effect, Schema } from "effect"
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

const log200 = (body: string) => Effect.log(body)

Effect.tap(client.test({}), log200)
