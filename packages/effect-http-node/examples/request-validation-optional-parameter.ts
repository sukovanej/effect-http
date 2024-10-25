import { pipe, Schema } from "effect"
import { Api } from "effect-http"

const Stuff = Schema.Struct({ value: Schema.Number })
const StuffParams = Schema.Struct({
  param: Schema.String,
  another: Schema.optional(Schema.String)
})

export const api = pipe(
  Api.make({ title: "My api" }),
  Api.addEndpoint(
    pipe(
      Api.get("stuff", "/stuff/:param/:another?"),
      Api.setResponseBody(Stuff),
      Api.setRequestPath(StuffParams)
    )
  )
)
