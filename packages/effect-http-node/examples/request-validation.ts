import { Schema } from "@effect/schema"
import { Api } from "effect-http"

const Stuff = Schema.Struct({ value: Schema.Number })
const StuffRequest = Schema.Struct({ field: Schema.Array(Schema.String) })
const StuffQuery = Schema.Struct({ value: Schema.String })
const StuffPath = Schema.Struct({ param: Schema.String })

export const api = Api.make({ title: "My api" }).pipe(
  Api.addEndpoint(
    Api.post("stuff", "/stuff/:param").pipe(
      Api.setRequestBody(StuffRequest),
      Api.setRequestQuery(StuffQuery),
      Api.setRequestPath(StuffPath),
      Api.setResponseBody(Stuff)
    )
  )
)
