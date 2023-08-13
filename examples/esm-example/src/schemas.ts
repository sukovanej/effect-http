import * as Schema from "@effect/schema/Schema";

const Integer = Schema.number.pipe(Schema.int());
const IntegerFromString = Schema.NumberFromString.pipe(Schema.int());

export const Item = Schema.struct({
  id: Integer,
  title: Schema.string,
  content: Schema.string,
  createdAt: Schema.Date,
  updatedAt: Schema.optionFromNullable(Schema.Date),
});
export type Item = Schema.To<typeof Item>;

export const Items = Schema.array(Item);
export type Items = Schema.To<typeof Items>;

export const CreateItemRequest = Item.pipe(
  Schema.omit("id", "createdAt", "updatedAt"),
);
export type CreateItemRequest = Schema.To<typeof CreateItemRequest>;

export const CreateItemResponse = Item.pipe(Schema.pick("id", "createdAt"));

export const GetItemsQuery = Item.pipe(
  Schema.pick("title", "content"),
  Schema.extend(Schema.struct({ id: IntegerFromString })),
  Schema.partial,
);
export type GetItemsQuery = Schema.To<typeof GetItemsQuery>;
