import { Api } from "effect-http";

import {
  CreateItemRequest,
  CreateItemResponse,
  GetItemsQuery,
  Items,
} from "./schemas.js";

export const api = Api.api({ title: "Example TODO list API" }).pipe(
  Api.post("createItem", "/item", {
    request: {
      body: CreateItemRequest,
    },
    response: {
      status: 201,
      content: CreateItemResponse,
    },
  }),
  Api.get("getItems", "/items", {
    request: {
      query: GetItemsQuery,
    },
    response: Items,
  }),
);
