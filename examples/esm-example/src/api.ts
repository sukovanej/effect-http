import * as Http from "effect-http";

import {
  CreateItemRequest,
  CreateItemResponse,
  GetItemsQuery,
  Items,
} from "./schemas.js";

export const api = Http.api({ title: "Example TODO list API" }).pipe(
  Http.post("createItem", "/item", {
    request: {
      body: CreateItemRequest,
    },
    response: {
      status: 201,
      content: CreateItemResponse,
    },
  }),
  Http.get("getItems", "/items", {
    request: {
      query: GetItemsQuery,
    },
    response: Items,
  }),
);

export type Api = typeof api;
