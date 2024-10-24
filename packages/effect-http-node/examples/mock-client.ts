import { Effect, pipe, Schema } from "effect"
import { Api, MockClient } from "effect-http"

export const exampleApiGet = Api.make().pipe(
  Api.addEndpoint(
    Api.get("getValue", "/get-value").pipe(
      Api.setResponseBody(Schema.Number)
    )
  )
)

const client = MockClient.make(exampleApiGet)

const program = pipe(
  client.getValue({}),
  Effect.tap(Effect.log),
  Effect.scoped
)

Effect.runFork(program)
