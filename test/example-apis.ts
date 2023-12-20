import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api } from "effect-http"

export const simpleApi1 = pipe(
  Api.api(),
  Api.get("myOperation", "/get", { response: Schema.string })
)

export const ALL_APIS = [simpleApi1]
