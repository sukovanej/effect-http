import { Array, Context, Effect, Layer, Option, Ref } from "effect"

import type { CreateItemRequest, GetItemsQuery, Item, Items } from "./schemas.js"

export interface ItemRepository {
  getItems: (query: GetItemsQuery) => Effect.Effect<Items>
  createItem: (item: CreateItemRequest) => Effect.Effect<Item>
}

export const ItemRepository = Context.GenericTag<ItemRepository>("@services/ItemRepository")

export const getItems = (...args: Parameters<ItemRepository["getItems"]>) =>
  Effect.flatMap(ItemRepository, ({ getItems }) => getItems(...args))

export const createItem = (...args: Parameters<ItemRepository["createItem"]>) =>
  Effect.flatMap(ItemRepository, ({ createItem }) => createItem(...args))

export const ItemRepositoryInMemory = Ref.make([] as Items).pipe(
  Effect.map((memory) =>
    ItemRepository.of({
      getItems: (query) =>
        Ref.get(memory).pipe(
          Effect.map(
            Array.filter((item) => {
              const matchesId = query.id === undefined ? true : item.id === query.id
              const matchesTitle = query.title === undefined
                ? true
                : item.title.includes(query.title)
              const matchesContent = query.content === undefined
                ? true
                : item.content.includes(query.content)

              return matchesId && matchesTitle && matchesContent
            })
          )
        ),
      createItem: (item) =>
        Effect.gen(function*() {
          const items = yield* Ref.get(memory)

          const newItem = {
            ...item,
            id: items.length + 1,
            createdAt: new Date(),
            updatedAt: Option.none()
          }

          yield* Ref.update(memory, Array.append(newItem))
          return newItem
        })
    })
  ),
  Layer.effect(ItemRepository)
)
