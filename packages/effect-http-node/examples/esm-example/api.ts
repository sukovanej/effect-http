import { Api } from "effect-http"

import { CreateItemRequest, CreateItemResponse, GetItemsQuery, Items } from "./schemas.js"

const createItem = Api.post("createItem", "/item").pipe(
  Api.setRequestBody(CreateItemRequest),
  Api.setResponseStatus(201),
  Api.setResponseBody(CreateItemResponse)
)

const getItems = Api.get("getItems", "/items").pipe(
  Api.setRequestQuery(GetItemsQuery),
  Api.setResponseBody(Items)
)

export const api = Api.make({ title: "Example TODO list API" }).pipe(
  Api.addEndpoint(createItem),
  Api.addEndpoint(getItems)
)
