import * as it from "@effect/vitest"
import { Effect, Option } from "effect"
import { MockClient } from "effect-http"
import { expect } from "vitest"
import { exampleApiGet, exampleApiPostNullableField } from "./examples.js"

it.effect(
  "random example",
  () =>
    Effect.gen(function*(_) {
      const client = MockClient.make(exampleApiGet)
      const response = yield _(client.getValue({}))

      expect(typeof response).toEqual("number")
    })
)

it.effect(
  "custom response",
  () =>
    Effect.gen(function*(_) {
      const client = MockClient.make(exampleApiGet, {
        responses: { getValue: 12 }
      })
      const response = yield* _(client.getValue({}))

      expect(response).toEqual(12)
    })
)

it.effect(
  "response schema with `optionFromNullable`",
  () =>
    Effect.gen(function*(_) {
      const client = MockClient.make(exampleApiPostNullableField)
      const response = yield* _(client.test({}))

      expect(Option.isOption(response.value)).toBe(true)
    })
)
