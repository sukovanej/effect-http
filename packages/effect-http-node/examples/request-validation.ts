import { Schema } from "@effect/schema"
import { Api } from "effect-http"

const Stuff = Schema.struct({ value: Schema.number })
const StuffRequest = Schema.struct({ field: Schema.array(Schema.string) })
const StuffQuery = Schema.struct({ value: Schema.string })
const StuffPath = Schema.struct({ param: Schema.string })

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
