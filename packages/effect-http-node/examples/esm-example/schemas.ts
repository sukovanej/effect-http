import * as Schema from "@effect/schema/Schema"

const Integer = Schema.number.pipe(Schema.int())
const IntegerFromString = Schema.NumberFromString.pipe(Schema.int())

export const Item = Schema.struct({
  id: Integer,
  title: Schema.string,
  content: Schema.string,
  createdAt: Schema.Date,
  updatedAt: Schema.optionFromNullable(Schema.Date)
})
export type Item = Schema.Schema.Type<typeof Item>

export const Items = Schema.array(Item)
export type Items = Schema.Schema.Type<typeof Items>

export const CreateItemRequest = Item.pipe(
  Schema.omit("id", "createdAt", "updatedAt")
)
export type CreateItemRequest = Schema.Schema.Type<typeof CreateItemRequest>

export const CreateItemResponse = Item.pipe(Schema.pick("id", "createdAt"))

export const GetItemsQuery = Item.pipe(
  Schema.pick("title", "content"),
  Schema.extend(Schema.struct({ id: IntegerFromString })),
  (schema) => Schema.partial(schema)
)
export type GetItemsQuery = Schema.Schema.Type<typeof GetItemsQuery>
