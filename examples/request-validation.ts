import { Schema } from "@effect/schema"
import { Api } from "effect-http"

const Stuff = Schema.struct({ value: Schema.number })
const StuffRequest = Schema.struct({ field: Schema.array(Schema.string) })
const StuffQuery = Schema.struct({ value: Schema.string })
const StuffParams = Schema.struct({ param: Schema.string })

export const api = Api.api({ title: "My api" }).pipe(
  Api.post("stuff", "/stuff/:param", {
    response: Stuff,
    request: {
      body: StuffRequest,
      query: StuffQuery,
      params: StuffParams
    }
  })
)
