import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as Pipeable from "effect/Pipeable"
import type * as Representation from "../Representation.js"

/** @internal */
export const TypeId: Representation.TypeId = Symbol.for(
  "effect-http/Representation/Representation"
) as Representation.TypeId

/** @internal */
class RepresentationErrorImpl extends Data.TaggedError("RepresentationError")<{ message: string }>
  implements Representation.RepresentationError
{}

/** @internal */
const representationProto = {
  [TypeId]: TypeId,
  pipe() {
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const make = (
  fields: Omit<Representation.Representation, Representation.TypeId | "pipe">
): Representation.Representation => {
  const representation = Object.create(representationProto)
  return Object.assign(representation, fields)
}

/** @internal */
export const json = make({
  stringify: (input) =>
    Effect.try({
      try: () => JSON.stringify(input),
      catch: (error) =>
        new RepresentationErrorImpl({
          message: `JSON parsing failed with ${error}`
        })
    }),
  parse: (input) =>
    Effect.try({
      try: () => JSON.parse(input),
      catch: (error) =>
        new RepresentationErrorImpl({
          message: `JSON stringify failed with ${error}`
        })
    }),
  contentType: "application/json"
})

/** @internal */
export const plainText = make({
  stringify: (input) => {
    if (typeof input === "string") {
      return Effect.succeed(input)
    } else if (typeof input === "number") {
      return Effect.succeed(String(input))
    }

    return json.stringify(input)
  },
  parse: Effect.succeed,
  contentType: "text/plain"
})
