import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api } from "effect-http"

const Stuff = Schema.struct({ value: Schema.number })
const StuffParams = Schema.struct({
  param: Schema.string,
  another: Schema.optional(Schema.string)
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
