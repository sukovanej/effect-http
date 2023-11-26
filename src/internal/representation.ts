import type * as Representation from "effect-http/Representation";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Pipeable from "effect/Pipeable";

export const TypeId: Representation.TypeId = Symbol.for(
  "effect-http/Representation/Representation",
) as Representation.TypeId;

class RepresentationErrorImpl
  extends Data.TaggedError("RepresentationError")<{ message: string }>
  implements Representation.RepresentationError {}

const representationProto = {
  [TypeId]: TypeId,
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments);
  },
};

export const make = (
  fields: Omit<Representation.Representation, Representation.TypeId | "pipe">,
): Representation.Representation => {
  const representation = Object.create(representationProto);
  return Object.assign(representation, fields);
};

export const json = make({
  stringify: (input) =>
    Effect.try({
      try: () => JSON.stringify(input),
      catch: (error) =>
        new RepresentationErrorImpl({
          message: `JSON parsing failed with ${error}`,
        }),
    }),
  parse: (input) =>
    Effect.try({
      try: () => JSON.parse(input),
      catch: (error) =>
        new RepresentationErrorImpl({
          message: `JSON stringify failed with ${error}`,
        }),
    }),
  contentType: "application/json",
});

export const plainText = make({
  stringify: (input) => {
    if (typeof input === "string") {
      return Effect.succeed(input);
    } else if (typeof input === "number") {
      return Effect.succeed(String(input));
    }

    return json.stringify(input);
  },
  parse: Effect.succeed,
  contentType: "text/plain",
});
