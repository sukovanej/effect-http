import { expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { Representation } from "effect-http"

it.effect.each(
  [
    { input: "string", expected: "string" },
    { input: 69, expected: "69" },
    { input: 69.42, expected: "69.42" },
    { input: [12, "12"], expected: "[12,\"12\"]" },
    { input: { a: "b" }, expected: "{\"a\":\"b\"}" }
  ] as const
)("plain text stringify $input", ({ expected, input }) =>
  Effect.gen(function*() {
    const result = yield* Representation.plainText.stringify(input)
    expect(result).toEqual(expected)
  }))
