import * as Schema from "@effect/schema/Schema";
import type * as Representation from "effect-http/Representation";
import * as Pipeable from "effect/Pipeable";

export const TypeId: Representation.TypeId = Symbol.for(
  "effect-http/Representation/Representation",
) as Representation.TypeId;

const representationProto = {
  [TypeId]: TypeId,
  pipe() {
    return Pipeable.pipeArguments(this, arguments);
  },
};

export const make = <A>(
  fields: Omit<
    Representation.Representation<A>,
    Representation.TypeId | "pipe"
  >,
) => {
  const representation = Object.create(representationProto);
  return Object.assign(representation, fields);
};

export const json = make({
  schema: Schema.ParseJson,
  contentType: "application/json",
});

export const plainText = make({
  schema: Schema.string,
  contentType: "text/plain",
});
