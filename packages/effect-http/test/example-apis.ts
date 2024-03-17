import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api } from "effect-http"

export const simpleApi1 = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("myOperation", "/get").pipe(
      Api.setResponseBody(Schema.string)
    )
  )
)

export const ALL_APIS = [simpleApi1]
