import { Effect } from "effect"
import { RouterBuilder } from "effect-http"

import { api } from "./api.js"
import { createItem, getItems } from "./repository.js"

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("getItems", ({ query }) =>
    getItems(query).pipe(
      Effect.tap((items) => Effect.log(`Found ${items.length} items`))
    )),
  RouterBuilder.handle("createItem", ({ body }) =>
    createItem(body).pipe(
      Effect.map((content) => ({ content, status: 201 as const }))
    )),
  RouterBuilder.build
)
